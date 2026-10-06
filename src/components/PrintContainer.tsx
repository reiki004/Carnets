import React from 'react';
import { CardState } from './CardPreview';
import { DEFAULTS } from '../assets/cardAssets';

interface PrintContainerProps {
  card?: CardState | null;
  cards?: CardState[] | null;
}

const renderSingleCard = (card: CardState, keyPrefix = 'card') => {
  const isAdmin = card.tipo === 'admin';

  return (
    <React.Fragment key={keyPrefix}>
      {/* PÁGINA 1: FRENTE DE LA TARJETA (CR-80 EXACTO 55x86.5mm) */}
      <div className="card-block">
        <div className={`card card-front ${isAdmin ? 'is-admin' : ''}`} style={{ width: '55mm', height: '86.5mm' }}>
          {/* Encabezado ENCABEZADO.jpg */}
          <img
            className="f-header"
            src={card.headerUrl || DEFAULTS.header}
            alt=""
          />

          {/* Cuerpo interior parejo, centrado y sin sobreposiciones */}
          <div className="f-body">
            {/* Foto centrada - El nivelador escala todo el cuadro */}
            <div
              className="f-photo-box"
              style={{
                transform: `scale(${(card.photoScale ?? 100) / 100})`,
                transformOrigin: isAdmin ? 'center center' : 'center top',
              }}
            >
              <img
                src={card.photoUrl || DEFAULTS.photo}
                alt=""
                className="f-photo-img"
                style={{
                  transform:
                    card.photoOffsetX || card.photoOffsetY
                      ? `translate(${card.photoOffsetX ?? 0}px, ${card.photoOffsetY ?? 0}px)`
                      : undefined,
                }}
              />
            </div>

            {/* Apellidos y Nombres en letras negras */}
            <div className="f-names-box">
              <div className="f-apellidos">
                {card.apellidos ? card.apellidos.toUpperCase() : 'APELLIDO'}
              </div>
              <div className="f-nombres">
                {card.nombres ? card.nombres.toUpperCase() : 'NOMBRE'}
              </div>
            </div>

            {/* Escudo / Logo centrado - El nivelador escala todo el cuadro */}
            {!isAdmin && (
              <div
                className="f-logo-box"
                style={{
                  transform: `scale(${(card.logoScale ?? 100) / 100})`,
                  transformOrigin: 'center center',
                }}
              >
                <img
                  src={card.logoUrl || DEFAULTS.logo}
                  alt=""
                  className="f-logo-img"
                />
              </div>
            )}

            {/* Nombre del Club en letras negras */}
            <div className="f-club-box">
              <div className="f-clubname">
                {card.clubname
                  ? card.clubname.toUpperCase()
                  : isAdmin
                  ? 'DIRECTIVO'
                  : 'NOMBRE DEL CLUB'}
              </div>
            </div>
          </div>

          {/* Pie inferior facetado con amplio espacio */}
          <img
            className="f-footer"
            src={card.footerUrl || DEFAULTS.footer}
            alt=""
            style={{ height: `${card.footerHeight ?? 20}%` }}
          />
        </div>
      </div>

      {/* PÁGINA 2: DORSO DE LA TARJETA */}
      <div className="card-block">
        <div className="card card-back" style={{ width: '55mm', height: '86.5mm' }}>
          {/* Slogan superior */}
          <img
            className="b-top"
            src={card.backTopUrl || DEFAULTS.backtop}
            alt=""
          />

          {/* Fecha de Nacimiento y DNI en letras negras */}
          <div className="b-mid">
            <div
              className="b-field b-nac"
              style={{ fontFamily: 'Arial, "Arial", Arimo, "Helvetica Neue", Helvetica, sans-serif' }}
            >
              F. Nacimiento: {card.fnac || 'dd/mm/aaaa'}
            </div>
            <div
              className="b-field b-dni"
              style={{ fontFamily: 'Arial, "Arial", Arimo, "Helvetica Neue", Helvetica, sans-serif' }}
            >
              DNI: {card.dni || '00000000'}
            </div>
          </div>

          {/* Categoría o Terna arbitral arriba de la imagen de redes sociales */}
          {card.showCategoria && (card.terna || card.categoria) && (
            <div
              className="b-categoria"
              style={{ fontFamily: 'Arial, "Arial", Arimo, "Helvetica Neue", Helvetica, sans-serif' }}
            >
              {card.tipo === 'admin'
                ? `Terna: ${(card.terna || card.categoria || '').replace(/^terna:\s*/i, '').trim().toUpperCase()}`
                : (card.categoria || '').toUpperCase()}
            </div>
          )}

          {/* Redes y Web */}
          <img
            className="b-bottom"
            src={card.backBottomUrl || DEFAULTS.backbottom}
            alt=""
          />
        </div>
      </div>
    </React.Fragment>
  );
};

export const PrintContainer: React.FC<PrintContainerProps> = ({ card, cards }) => {
  const cardsToPrint = cards && cards.length > 0 ? cards : card ? [card] : [];
  if (!cardsToPrint.length) return null;

  return (
    <div className="print-only-container hidden print:block">
      {cardsToPrint.map((c, idx) => renderSingleCard(c, `print-card-${idx}-${c.dni}`))}
    </div>
  );
};
