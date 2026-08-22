declare module "pdf-parse-debugging-disabled" {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    text: string;
    version: string;
  }

  function pdf(
    dataBuffer: Buffer | ArrayBuffer | Uint8Array
  ): Promise<PDFData>;

  export default pdf;
}
