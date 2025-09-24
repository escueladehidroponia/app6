import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, SunIcon, MoonIcon, BookOpenIcon } from '@heroicons/react/24/outline';

const Boton = ({ children, onClick, className = '', ...props }) => (
  <button 
    onClick={onClick} 
    className={`px-3 py-2 rounded-md font-semibold text-sm flex items-center justify-center gap-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default function Lector({ libro, onVolver }) {
  const [capituloActual, setCapituloActual] = useState(0);
  const [config, setConfig] = useState(() => {
    const guardado = localStorage.getItem('lectorConfig');
    return guardado ? JSON.parse(guardado) : {
      fontSize: 16,
      theme: 'claro',
    };
  });

  useEffect(() => {
    localStorage.setItem('lectorConfig', JSON.stringify(config));
  }, [config]);

  const cambiarCapitulo = (siguiente) => {
    const nuevoIndex = siguiente ? capituloActual + 1 : capituloActual - 1;
    if (nuevoIndex >= 0 && nuevoIndex < libro.capitulos.length) {
      setCapituloActual(nuevoIndex);
    }
  };

  const ajustarFuente = (incremento) => {
    setConfig(c => ({ ...c, fontSize: Math.max(12, Math.min(32, c.fontSize + incremento)) }));
  };

  const temas = {
    claro: 'bg-white text-gray-800',
    oscuro: 'bg-gray-800 text-gray-200',
    sepia: 'bg-[#fbf0d9] text-[#5b4636]',
  };

  const capitulo = libro.capitulos[capituloActual];
  const textoCapitulo = capitulo.contenido.find(c => c.artesanoId === 'base')?.texto || 'Este capítulo no tiene contenido base.';

  return (
    <div className={`w-full h-full flex flex-col ${temas[config.theme]}`}>
      {/* Barra Superior */}
      <header className="flex justify-between items-center p-4 border-b border-gray-300 dark:border-gray-700 flex-shrink-0">
        <Boton onClick={onVolver}><ArrowLeftIcon className="h-5 w-5" /> Volver a Mis Libros</Boton>
        <div className="text-center">
          <h2 className="text-xl font-bold">{libro.titulo}</h2>
          <p className="text-sm">Capítulo {capituloActual + 1} de {libro.capitulos.length}: {capitulo.titulo}</p>
        </div>
        <div className="flex items-center gap-4">
          <Boton onClick={() => ajustarFuente(-2)} disabled={config.fontSize <= 12}>A-</Boton>
          <span>{config.fontSize}px</span>
          <Boton onClick={() => ajustarFuente(2)} disabled={config.fontSize >= 32}>A+</Boton>
          <Boton onClick={() => setConfig(c => ({...c, theme: 'claro'}))}><SunIcon className="h-5 w-5" /></Boton>
          <Boton onClick={() => setConfig(c => ({...c, theme: 'oscuro'}))}><MoonIcon className="h-5 w-5" /></Boton>
          <Boton onClick={() => setConfig(c => ({...c, theme: 'sepia'}))}><BookOpenIcon className="h-5 w-5" /></Boton>
        </div>
      </header>

      {/* Contenido del Libro */}
      <main className="flex-grow overflow-y-auto p-8 md:p-12 lg:p-16">
        <div 
          className="max-w-4xl mx-auto prose dark:prose-invert lg:prose-xl"
          style={{ fontSize: `${config.fontSize}px` }}
        >
          <h3 className="text-2xl font-bold mb-4">{capitulo.titulo}</h3>
          <p className="whitespace-pre-wrap leading-relaxed">
            {textoCapitulo}
          </p>
        </div>
      </main>

      {/* Barra Inferior / Paginación */}
      <footer className="flex justify-between items-center p-4 border-t border-gray-300 dark:border-gray-700 flex-shrink-0">
        <Boton onClick={() => cambiarCapitulo(false)} disabled={capituloActual === 0}>
          <ArrowLeftIcon className="h-5 w-5" /> Anterior
        </Boton>
        <span>Página {capituloActual + 1} de {libro.capitulos.length}</span>
        <Boton onClick={() => cambiarCapitulo(true)} disabled={capituloActual >= libro.capitulos.length - 1}>
          Siguiente <ArrowRightIcon className="h-5 w-5" />
        </Boton>
      </footer>
    </div>
  );
}
