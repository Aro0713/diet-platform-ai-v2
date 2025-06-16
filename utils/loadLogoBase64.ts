export async function loadLogoBase64(path = '/logo-dietcare.png'): Promise<string> {
  const response = await fetch(path);
  const blob = await response.blob();

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject('FileReader failed');
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string' && result.startsWith('data:image')) {
        resolve(result);
      } else {
        reject('Invalid base64 string');
      }
    };
    reader.readAsDataURL(blob);
  });
}
