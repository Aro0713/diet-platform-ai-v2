export default function Custom500() {
  return (
    <main className='min-h-screen flex items-center justify-center text-white bg-red-900 px-6'>
      <div className='text-center'>
        <h1 className='text-3xl font-bold'>Błąd serwera (500)</h1>
        <p className='mt-4 text-lg max-w-xl mx-auto'>
          Coś poszło nie tak po stronie systemu. Spróbuj ponownie później lub skontaktuj się z pomocą techniczną.
        </p>
      </div>
    </main>
  );
}