const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

const I = (children) =>
  function Icone({ size = 22, ...rest }) {
    return (
      <svg {...base} width={size} height={size} {...rest}>
        {children}
      </svg>
    );
  };

export const IconSacola = I(
  <>
    <path d="M5 8h14l-1 12H6L5 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </>
);
export const IconBusca = I(
  <>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </>
);
export const IconFechar = I(<path d="M6 6l12 12M18 6 6 18" />);
export const IconMais = I(<path d="M12 5v14M5 12h14" />);
export const IconLixeira = I(
  <>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 12h10l1-12M9 7V5h6v2" />
  </>
);
export const IconCheck = I(<path d="m5 12.5 4.5 4.5L19 7.5" />);
export const IconEditar = I(
  <>
    <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
    <path d="m13.5 6.5 4 4" />
  </>
);
export const IconCamera = I(
  <>
    <path d="M4 8h3l1.5-2h7L17 8h3v11H4V8Z" />
    <circle cx="12" cy="13" r="3.5" />
  </>
);
export const IconCabide = I(
  <>
    <path d="M12 8V6.5a2 2 0 1 1 2 2" />
    <path d="M12 8 3.5 14.2c-.9.7-.4 1.8.7 1.8h15.6c1.1 0 1.6-1.1.7-1.8L12 8Z" />
  </>
);
export const IconCadeado = I(
  <>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </>
);
export const IconInstagram = I(
  <>
    <rect x="4" y="4" width="16" height="16" rx="5" />
    <circle cx="12" cy="12" r="3.6" />
    <circle cx="16.8" cy="7.2" r=".6" fill="currentColor" />
  </>
);
export const IconProdutos = I(
  <>
    <path d="M3.5 9 8 4h8l4.5 5-8.5 11L3.5 9Z" />
    <path d="M3.5 9h17M9 9l3 11 3-11M8 4l1 5M16 4l-1 5" />
  </>
);
export const IconPedidos = I(
  <>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4v2h6V4M9 11h6M9 15h4" />
  </>
);
export const IconRelogio = I(
  <>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 7.5V12l3 2" />
  </>
);
export const IconDinheiro = I(
  <>
    <rect x="3.5" y="6.5" width="17" height="11" rx="2" />
    <circle cx="12" cy="12" r="2.6" />
    <path d="M7 10v4M17 10v4" />
  </>
);
export const IconEngrenagem = I(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" />
  </>
);
export const IconSeta = I(<path d="M15 5 8 12l7 7" />);
export const IconSair = I(
  <>
    <path d="M10 5H5v14h5" />
    <path d="M15 8l4 4-4 4M19 12H9" />
  </>
);
export const IconOlho = I(
  <>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </>
);

export function IconWhatsapp({ size = 22, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
