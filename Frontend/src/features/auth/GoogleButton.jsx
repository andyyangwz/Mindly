import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function GoogleButton({ isLight, onSuccess, onError }) {
  const { t } = useTranslation();
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const btnRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    function init() {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredential,
        });
        setInitialized(true);
      } else {
        setTimeout(init, 300);
      }
    }
    init();
  }, []);

  function handleCredential(response) {
    setLoading(true);
    if (response?.credential) {
      onSuccess(response.credential);
    } else {
      onError?.(t("auth.google.cancel"));
      setLoading(false);
    }
  }

  function handleClick() {
    if (!GOOGLE_CLIENT_ID) {
      onError?.(t("auth.google.notConfigured"));
      return;
    }
    setLoading(true);
    window.google?.accounts?.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setLoading(false);
        try {
          const parent = btnRef.current;
          if (parent) {
            const div = document.createElement("div");
            div.style.display = "none";
            parent.appendChild(div);
            window.google?.accounts?.id.renderButton(div, {
              theme: isLight ? "outline" : "filled_black",
              size: "large",
              type: "standard",
              shape: "pill",
            });
            div.querySelector("div")?.click();
          }
        } catch {}
      }
    });
  }

  const c = isLight
    ? {
        bg: "rgba(255,255,255,0.8)",
        border: "rgba(45,43,61,0.08)",
        text: "rgba(45,43,61,0.75)",
        hoverBorder: "rgba(45,43,61,0.15)",
        hoverBg: "rgba(255,255,255,0.95)",
        shadow: "0 2px 8px rgba(0,0,0,0.04)",
        hoverShadow: "0 4px 16px rgba(0,0,0,0.06)",
      }
    : {
        bg: "rgba(255,255,255,0.04)",
        border: "rgba(255,255,255,0.08)",
        text: "rgba(232,230,240,0.7)",
        hoverBorder: "rgba(255,255,255,0.15)",
        hoverBg: "rgba(255,255,255,0.07)",
        shadow: "0 2px 8px rgba(0,0,0,0.2)",
        hoverShadow: "0 4px 16px rgba(0,0,0,0.3)",
      };

  return (
    <div ref={btnRef}>
      <motion.button
        type="button"
        onClick={handleClick}
        disabled={loading}
        whileHover={loading ? {} : { scale: 1.015, boxShadow: c.hoverShadow }}
        whileTap={loading ? {} : { scale: 0.985 }}
        style={{
          width: "100%",
          padding: "12px 20px",
          borderRadius: 10,
          border: `1px solid ${c.border}`,
          background: c.bg,
          color: c.text,
          fontSize: 13,
          fontWeight: 500,
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          opacity: loading ? 0.6 : 1,
          boxShadow: c.shadow,
          transition: "all 0.25s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = c.hoverBorder;
          e.currentTarget.style.background = c.hoverBg;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = c.border;
          e.currentTarget.style.background = c.bg;
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2045C17.64 8.5663 17.5827 7.9527 17.4764 7.3636H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.2045Z" fill="#4285F4"/>
          <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957273V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
          <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957273C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957273 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
          <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957273 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
        </svg>
        {loading ? t("auth.google.signingIn") : t("auth.google.continue")}
      </motion.button>
    </div>
  );
}
