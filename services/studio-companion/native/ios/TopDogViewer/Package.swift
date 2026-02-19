// swift-tools-version: 5.9
// TopDog Studio — iOS Companion Viewer App
//
// This Package.swift is used for building the viewer app via command line.
// For Xcode development, open the project directly.

import PackageDescription

let package = Package(
    name: "TopDogViewer",
    platforms: [
        .iOS(.v17),
        .macOS(.v14),
    ],
    products: [
        .executable(name: "TopDogViewer", targets: ["TopDogViewer"]),
    ],
    targets: [
        .executableTarget(
            name: "TopDogViewer",
            path: "TopDogViewer"
        ),
    ]
)
