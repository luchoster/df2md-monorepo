/** The old site's 24px Instagram (gradient) and Facebook icons, as inline SVG. */
export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden>
      <defs>
        <linearGradient id="ig-a">
          <stop offset="0" stopColor="#ffc107" />
          <stop offset=".507" stopColor="#f44336" />
          <stop offset=".99" stopColor="#9c27b0" />
        </linearGradient>
        <linearGradient
          id="ig-b"
          href="#ig-a"
          gradientTransform="matrix(32 0 0 -32 1519 20757)"
          gradientUnits="userSpaceOnUse"
          x1="-46.0041"
          x2="-32.9334"
          y1="634.1208"
          y2="647.1917"
        />
        <linearGradient
          id="ig-c"
          href="#ig-a"
          gradientTransform="matrix(32 0 0 -32 1519 20757)"
          gradientUnits="userSpaceOnUse"
          x1="-42.2971"
          x2="-36.6404"
          y1="637.8279"
          y2="643.4846"
        />
        <linearGradient
          id="ig-d"
          href="#ig-a"
          gradientTransform="matrix(32 0 0 -32 1519 20757)"
          gradientUnits="userSpaceOnUse"
          x1="-35.5456"
          x2="-34.7919"
          y1="644.5793"
          y2="645.3331"
        />
      </defs>
      <path
        fill="url(#ig-b)"
        d="m352 0h-192c-88.352 0-160 71.648-160 160v192c0 88.352 71.648 160 160 160h192c88.352 0 160-71.648 160-160v-192c0-88.352-71.648-160-160-160zm112 352c0 61.76-50.24 112-112 112h-192c-61.76 0-112-50.24-112-112v-192c0-61.76 50.24-112 112-112h192c61.76 0 112 50.24 112 112z"
      />
      <path
        fill="url(#ig-c)"
        d="m256 128c-70.688 0-128 57.312-128 128s57.312 128 128 128 128-57.312 128-128-57.312-128-128-128zm0 208c-44.096 0-80-35.904-80-80 0-44.128 35.904-80 80-80s80 35.872 80 80c0 44.096-35.904 80-80 80z"
      />
      <circle cx="393.6" cy="118.4" r="17.056" fill="url(#ig-d)" />
    </svg>
  )
}

export function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden>
      <path
        fill="#1976D2"
        d="M448,0H64C28.704,0,0,28.704,0,64v384c0,35.296,28.704,64,64,64h384c35.296,0,64-28.704,64-64V64C512,28.704,483.296,0,448,0z"
      />
      <path
        fill="#FAFAFA"
        d="M432,256h-80v-64c0-17.664,14.336-16,32-16h32V96h-64l0,0c-53.024,0-96,42.976-96,96v64h-64v80h64v176h96V336h48L432,256z"
      />
    </svg>
  )
}
