export async function sendToPatient(
  email: string,
  pdfBlob: Blob,
  lang: string = 'pl',
  filename: string = 'dieta.pdf'
): Promise<boolean> {
  const pdfBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(pdfBlob);
  });

  const res = await fetch('https://iqjvpuozmblnjeycdaeg.supabase.co/functions/v1/send-diet-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: email,
      lang,
      pdfBase64,
      filename // nowy klucz przesyłany do backendu
    })
  });

  return res.ok;
}
