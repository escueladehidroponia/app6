import React, { useState, useEffect, useRef } from 'react';
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

export default function Lector({ libro, onVolver, onAddAnnotation, onRemoveAnnotation }) {
  const [capituloActual, setCapituloActual] = useState(0);
  const [config, setConfig] = useState(() => {
    const guardado = localStorage.getItem('lectorConfig');
    return guardado ? JSON.parse(guardado) : {
      fontSize: 18,
      theme: 'claro',
    };
  });
  const [selection, setSelection] = useState(null);
  const contentRef = useRef(null);
  const [notaViendo, setNotaViendo] = useState(null);

  useEffect(() => {
    localStorage.setItem('lectorConfig', JSON.stringify(config));
  }, [config]);

  const cambiarCapitulo = (siguiente) => {
    const nuevoIndex = siguiente ? capituloActual + 1 : capituloActual - 1;
    if (nuevoIndex >= 0 && nuevoIndex < libro.capitulos.length) {
      setCapituloActual(nuevoIndex);
      setSelection(null);
    }
  };

  const ajustarFuente = (incremento) => {
    setConfig(c => ({ ...c, fontSize: Math.max(12, Math.min(32, c.fontSize + incremento)) }));
  };

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      if (contentRef.current && contentRef.current.contains(range.commonAncestorContainer)) {
        const rect = range.getBoundingClientRect();
        setSelection({ range, rect });
      } else {
        setSelection(null);
      }
    } else {
      setSelection(null);
    }
  };

  const getAbsoluteOffset = (node, offset, container) => {
    const range = document.createRange();
    range.selectNodeContents(container);
    range.setEnd(node, offset);
    return range.toString().length;
  };

  const createAnnotation = (type) => {
    if (!selection || !contentRef.current) return;

    const { range } = selection;
    const contentDiv = contentRef.current.querySelector('.whitespace-pre-wrap');
    if (!contentDiv) return;

    const start = getAbsoluteOffset(range.startContainer, range.startOffset, contentDiv);
    const end = getAbsoluteOffset(range.endContainer, range.endOffset, contentDiv);

    const currentAnnotations = libro.capitulos[capituloActual].annotations || [];
    const overlaps = currentAnnotations.some(a => (start < a.end && end > a.start));

    if (overlaps) {
      alert("No se pueden crear anotaciones que se superpongan. Por favor, elimina la anotación existente primero.");
      setSelection(null);
      window.getSelection().removeAllRanges();
      return;
    }

    let noteContent;
    if (type === 'note') {
      noteContent = prompt("Escribe tu nota:")?.trim();
      if (!noteContent) {
        setSelection(null);
        window.getSelection().removeAllRanges();
        return;
      }
    }

    setSelection(null);
    window.getSelection().removeAllRanges();

    if (start >= end) {
      console.warn("Annotation creation failed: Invalid range selected.");
      return;
    }

    const text = range.toString();
    const annotation = {
      id: Date.now(),
      type,
      start,
      end,
      text,
    };

    if (type === 'note') {
      annotation.note = noteContent;
    }

    onAddAnnotation(libro.id, capitulo.id, annotation);
  };

  const handleHighlight = () => createAnnotation('highlight');
  const handleTakeNote = () => createAnnotation('note');

  const renderContentWithAnnotations = () => {
    const text = capitulo.contenido.find(c => c.artesanoId === 'base')?.texto || 'Este capítulo no tiene contenido base.';
    const annotations = capitulo.annotations || [];
    let lastIndex = 0;
    const parts = [];

    [...annotations]
      .sort((a, b) => a.start - b.start)
      .forEach(annotation => {
        if (annotation.start > lastIndex) {
          parts.push(text.substring(lastIndex, annotation.start));
        }

        const handleRemove = (e) => {
            e.preventDefault();
            if (window.confirm(`¿Estás seguro de que quieres eliminar est${annotation.type === 'note' ? 'a nota' : 'e subrayado'}?`)) {
                onRemoveAnnotation(libro.id, capitulo.id, annotation.id);
            }
        };

        if (annotation.type === 'note') {
            parts.push(
              <mark
                key={annotation.id}
                className="bg-blue-200/70 cursor-pointer underline decoration-dotted decoration-blue-500"
                onClick={() => setNotaViendo(annotation)}
                onContextMenu={handleRemove}
                title="Click para ver la nota. Click derecho para eliminar."
              >
                {text.substring(annotation.start, annotation.end)}
              </mark>
            );
        } else { // 'highlight'
            parts.push(
              <mark
                key={annotation.id}
                className="bg-yellow-300/70 cursor-pointer"
                onClick={handleRemove}
                title="Click para eliminar el subrayado."
              >
                {text.substring(annotation.start, annotation.end)}
              </mark>
            );
        }
        lastIndex = annotation.end;
      });

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  const temas = {
    claro: 'bg-white text-gray-800',
    oscuro: 'bg-gray-800 text-gray-200',
    sepia: 'bg-[#fbf0d9] text-[#5b4636]',
  };

  const capitulo = libro.capitulos[capituloActual];

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
      <main className="flex-grow overflow-y-auto p-8 md:p-12 lg:p-16 relative" ref={contentRef} onMouseUp={handleMouseUp}>
        {selection && (
          <div 
            style={{ top: selection.rect.top - contentRef.current.getBoundingClientRect().top - 40, left: selection.rect.left - contentRef.current.getBoundingClientRect().left + selection.rect.width / 2 - 50}} 
            className="absolute z-10 flex gap-2"
          >
            <Boton onClick={handleHighlight}>Subrayar</Boton>
            <Boton onClick={handleTakeNote}>Tomar Nota</Boton>
          </div>
        )}
        <div 
          className="max-w-4xl mx-auto prose dark:prose-invert lg:prose-xl"
          style={{ fontSize: `${config.fontSize}px` }}
        >
          <h3 className="text-2xl font-bold mb-4">{capitulo.titulo}</h3>
          <div className="whitespace-pre-wrap leading-relaxed">
            {renderContentWithAnnotations()}
          </div>
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

      {/* Modal para ver la nota */}
      {notaViendo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={() => setNotaViendo(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Nota</h3>
            <p className="mb-4 whitespace-pre-wrap text-gray-600 dark:text-gray-300 italic border-l-4 border-gray-300 pl-4">"{notaViendo.text}"</p>
            <div className="bg-yellow-100 dark:bg-yellow-900/50 p-4 rounded-md">
              <p className="whitespace-pre-wrap">{notaViendo.note}</p>
            </div>
            <div className="flex justify-end mt-6">
              <Boton onClick={() => setNotaViendo(null)}>Cerrar</Boton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}