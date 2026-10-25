// يحوّل رمز QR المرسوم إلى صورة PNG جاهزة للطباعة:
// - هامش شفاف حول الرمز بحيث يشغل الرمز نحو 46% من عرض الصورة فقط
//   (فيظهر صغيراً ومناسباً لشاشة الجوال عند فتح الصورة، وسهل الإدراج في Canva)
// - أبعاد فعلية مخزّنة داخل الملف (pHYs): الرمز بالحجم المطلوب (3 سم للبطاقة، 4 سم للأوفلاين)، فتفتحها المطبعة أو Word أو Canva بالحجم الصحيح.

const QR_SHARE = 0.46; // نسبة الرمز من عرض الصورة

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = crcTable[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function withDpi(png: Uint8Array, pixelsPerMeter: number): Uint8Array {
  const type = [0x70, 0x48, 0x59, 0x73]; // "pHYs"
  const data = new Uint8Array(9);
  const dv = new DataView(data.buffer);
  dv.setUint32(0, pixelsPerMeter);
  dv.setUint32(4, pixelsPerMeter);
  data[8] = 1; // متر
  const body = new Uint8Array(4 + 9);
  body.set(type, 0);
  body.set(data, 4);
  const chunk = new Uint8Array(4 + body.length + 4);
  new DataView(chunk.buffer).setUint32(0, 9);
  chunk.set(body, 4);
  new DataView(chunk.buffer).setUint32(4 + body.length, crc32(body));

  const insertAt = 8 + 25; // بعد توقيع PNG وقطعة IHDR
  const out = new Uint8Array(png.length + chunk.length);
  out.set(png.subarray(0, insertAt), 0);
  out.set(chunk, insertAt);
  out.set(png.subarray(insertAt), insertAt + chunk.length);
  return out;
}

/** qrCm: الحجم الفعلي المطلوب للرمز نفسه عند الطباعة بالسنتيمتر */
export async function makePrintPng(qrCanvas: HTMLCanvasElement, qrCm = 3): Promise<Blob> {
  const qrPx = qrCanvas.width;
  const pagePx = Math.round(qrPx / QR_SHARE);
  const page = document.createElement("canvas");
  page.width = pagePx;
  page.height = pagePx;
  const ctx = page.getContext("2d")!;
  const off = Math.round((pagePx - qrPx) / 2);
  ctx.drawImage(qrCanvas, off, off);

  const blob: Blob = await new Promise((res, rej) =>
    page.toBlob((b) => (b ? res(b) : rej(new Error("toBlob"))), "image/png")
  );
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const pageCm = qrCm / QR_SHARE;
  const ppm = Math.round(pagePx / (pageCm / 100));
  return new Blob([withDpi(bytes, ppm) as unknown as BlobPart], { type: "image/png" });
}
