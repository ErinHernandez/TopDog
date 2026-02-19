// Stub for ag-psd
export const readPsd = () => ({ width: 100, height: 100, children: [] });
export const writePsd = () => new Uint8Array(0);
export const writePsdBuffer = () => Buffer.from('');
export default { readPsd, writePsd, writePsdBuffer };
