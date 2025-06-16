/**
 * Wczytuje logo z katalogu public jako base64 (DataURL)
 * Może być używane w PDF, e-mailach, itp.
 */
export async function loadLogoBase64(path = '/logo-dietcare.png'): Promise<string> {
  const response = await fetch(path);
  const blob = await response.blob();

  return await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}
