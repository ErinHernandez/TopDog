/// TopDog Studio — Component Renderer
///
/// Manages the dynamic compilation and loading of SwiftUI components.
/// This is the core engine for Phase 5D hot reload support.
///
/// Strategy (ordered by preference):
///   1. Dynamic library loading (dlopen/dlsym) — Sub-second hot reload
///      - Compile component to .dylib via `swiftc -emit-library`
///      - Load at runtime with dlopen(), lookup rendering function with dlsym()
///      - On code change: compile new .dylib, dlclose() old, dlopen() new
///
///   2. Full rebuild fallback — When dynamic loading fails
///      - Write code to project, xcodebuild, install to simulator
///
/// Security note: This runs ONLY on the developer's local machine.
/// Code is received from the Studio via localhost WebSocket only.

import Foundation
import SwiftUI

/// Result of a component compilation
enum CompilationResult {
    case success(duration: TimeInterval)
    case error(errors: [CompilationError])
}

/// A compilation error with source location
struct CompilationError {
    let file: String
    let line: Int
    let column: Int
    let message: String
    let severity: ErrorSeverity

    enum ErrorSeverity: String {
        case error
        case warning
    }
}

/// Manages dynamic SwiftUI component compilation and rendering
@MainActor
final class ComponentRenderer: ObservableObject {
    static let shared = ComponentRenderer()

    // MARK: - Published State

    @Published var isCompiling = false
    @Published var lastCompilationResult: CompilationResult?
    @Published var loadedComponentId: String?

    // MARK: - Configuration

    /// Directory for writing generated source files
    private let generatedDir: URL

    /// Directory for compiled dynamic libraries
    private let buildDir: URL

    /// Cache of code hashes to avoid redundant builds
    private var buildCache: [String: String] = [:]

    // MARK: - Initialization

    init() {
        let caches = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        generatedDir = caches.appendingPathComponent("TopDogViewer/Generated")
        buildDir = caches.appendingPathComponent("TopDogViewer/Build")

        // Ensure directories exist
        try? FileManager.default.createDirectory(at: generatedDir, withIntermediateDirectories: true)
        try? FileManager.default.createDirectory(at: buildDir, withIntermediateDirectories: true)
    }

    // MARK: - Compilation

    /// Compile a SwiftUI component from source code
    /// - Parameters:
    ///   - componentId: Unique identifier for the component
    ///   - code: SwiftUI source code to compile
    /// - Returns: Compilation result
    func compile(componentId: String, code: String) async -> CompilationResult {
        isCompiling = true
        defer { isCompiling = false }

        let startTime = Date()

        // Check build cache
        let codeHash = code.hashValue.description
        if buildCache[componentId] == codeHash {
            let duration = Date().timeIntervalSince(startTime)
            lastCompilationResult = .success(duration: duration)
            return .success(duration: duration)
        }

        // Write source file
        let sourceFile = generatedDir.appendingPathComponent("Generated_\(componentId).swift")
        do {
            try code.write(to: sourceFile, atomically: true, encoding: .utf8)
        } catch {
            let err = CompilationError(
                file: sourceFile.lastPathComponent,
                line: 0,
                column: 0,
                message: "Failed to write source: \(error.localizedDescription)",
                severity: .error
            )
            lastCompilationResult = .error(errors: [err])
            return .error(errors: [err])
        }

        // Compile to dynamic library
        let dylibPath = buildDir.appendingPathComponent("Component_\(componentId).dylib")
        let result = await compileToDylib(sourceFile: sourceFile, outputPath: dylibPath)

        switch result {
        case .success:
            buildCache[componentId] = codeHash
            loadedComponentId = componentId
        case .error:
            break
        }

        lastCompilationResult = result
        return result
    }

    /// Compile a Swift source file to a dynamic library
    private func compileToDylib(sourceFile: URL, outputPath: URL) async -> CompilationResult {
        let startTime = Date()

        // Build swiftc command
        // -emit-library: produce a .dylib
        // -module-name: unique module name
        // -sdk: use the iOS SDK
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/xcrun")
        process.arguments = [
            "swiftc",
            "-emit-library",
            "-o", outputPath.path,
            "-module-name", "TopDogComponent",
            "-framework", "SwiftUI",
            "-sdk", sdkPath(),
            "-target", "arm64-apple-ios17.0-simulator",
            sourceFile.path,
        ]

        let pipe = Pipe()
        process.standardError = pipe

        do {
            try process.run()
            process.waitUntilExit()
        } catch {
            return .error(errors: [
                CompilationError(
                    file: sourceFile.lastPathComponent,
                    line: 0,
                    column: 0,
                    message: "Failed to launch swiftc: \(error.localizedDescription)",
                    severity: .error
                )
            ])
        }

        if process.terminationStatus == 0 {
            let duration = Date().timeIntervalSince(startTime)
            return .success(duration: duration)
        }

        // Parse compiler errors
        let errorData = pipe.fileHandleForReading.readDataToEndOfFile()
        let errorOutput = String(data: errorData, encoding: .utf8) ?? "Unknown error"
        let errors = parseCompilerErrors(errorOutput, sourceFile: sourceFile.lastPathComponent)

        return .error(errors: errors)
    }

    /// Get the iOS Simulator SDK path
    private func sdkPath() -> String {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/xcrun")
        process.arguments = ["--sdk", "iphonesimulator", "--show-sdk-path"]

        let pipe = Pipe()
        process.standardOutput = pipe

        do {
            try process.run()
            process.waitUntilExit()
            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            return String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        } catch {
            return ""
        }
    }

    /// Parse swiftc error output into structured errors
    private func parseCompilerErrors(_ output: String, sourceFile: String) -> [CompilationError] {
        var errors: [CompilationError] = []

        // swiftc format: filename:line:column: error: message
        let lines = output.components(separatedBy: "\n")
        for line in lines {
            let parts = line.components(separatedBy: ": ")
            guard parts.count >= 3 else { continue }

            let locationParts = parts[0].components(separatedBy: ":")
            guard locationParts.count >= 3,
                  let lineNum = Int(locationParts[1]),
                  let colNum = Int(locationParts[2]) else { continue }

            let severity: CompilationError.ErrorSeverity = parts[1].contains("warning") ? .warning : .error
            let message = parts[2...].joined(separator: ": ")

            errors.append(CompilationError(
                file: sourceFile,
                line: lineNum,
                column: colNum,
                message: message.trimmingCharacters(in: .whitespaces),
                severity: severity
            ))
        }

        // If no structured errors parsed, create a generic one
        if errors.isEmpty && !output.isEmpty {
            errors.append(CompilationError(
                file: sourceFile,
                line: 0,
                column: 0,
                message: output.trimmingCharacters(in: .whitespacesAndNewlines),
                severity: .error
            ))
        }

        return errors
    }

    // MARK: - Dynamic Loading

    /// Load a compiled component at runtime using dlopen
    /// Returns an opaque handle that can be used to render the component
    func loadComponent(componentId: String) -> UnsafeMutableRawPointer? {
        let dylibPath = buildDir.appendingPathComponent("Component_\(componentId).dylib").path

        // dlopen with RTLD_NOW for immediate symbol resolution
        guard let handle = dlopen(dylibPath, RTLD_NOW) else {
            let error = String(cString: dlerror())
            print("[ComponentRenderer] dlopen failed: \(error)")
            return nil
        }

        return handle
    }

    /// Unload a previously loaded component
    func unloadComponent(handle: UnsafeMutableRawPointer) {
        dlclose(handle)
    }

    // MARK: - Cache Management

    /// Clear the build cache, forcing recompilation on next request
    func clearCache() {
        buildCache.removeAll()
    }

    /// Clear all generated files and build artifacts
    func cleanBuildDirectory() {
        try? FileManager.default.removeItem(at: generatedDir)
        try? FileManager.default.removeItem(at: buildDir)
        try? FileManager.default.createDirectory(at: generatedDir, withIntermediateDirectories: true)
        try? FileManager.default.createDirectory(at: buildDir, withIntermediateDirectories: true)
        buildCache.removeAll()
    }
}
