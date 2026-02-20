import { useLocalization } from "@/Hooks/useLocalization";
import { AITranslationService } from "@/Services/AITranslationService";
import { useState } from "react";

/**
 * Componente de ejemplo que muestra todas las capacidades de localización
 */
export const LocalizationExamples = () => {
  const { t, date, number, currency, percent, compact, relative, list, plural } =
    useLocalization();
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const handleTranslate = async () => {
    setIsTranslating(true);
    try {
      const result = await AITranslationService.translate({
        text: "This is AI-generated content that needs translation",
        targetLanguage: "es",
        context: "Social media post",
      });
      setTranslatedText(result.translatedText);
    } catch (error) {
      } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">
          {t("common.localizationExamples")}
        </h2>
      </div>

      {/* Fechas */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Formatos de Fecha</h3>
        <div className="space-y-1 text-sm">
          <p>Short: {date(now, "short")}</p>
          <p>Medium: {date(now, "medium")}</p>
          <p>Long: {date(now, "long")}</p>
          <p>Full: {date(now, "full")}</p>
          <p>DateTime: {date(now, "datetime")}</p>
          <p>Time: {date(now, "time")}</p>
        </div>
      </section>

      {/* Fechas Relativas */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Fechas Relativas</h3>
        <div className="space-y-1 text-sm">
          <p>Ayer: {relative(yesterday)}</p>
          <p>Ahora: {relative(now)}</p>
          <p>Próxima semana: {relative(nextWeek)}</p>
        </div>
      </section>

      {/* Números */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Formatos de Números</h3>
        <div className="space-y-1 text-sm">
          <p>Número: {number(1234567.89)}</p>
          <p>Compacto: {compact(1234567)}</p>
          <p>Porcentaje: {percent(75.5)}</p>
          <p>
            Decimal personalizado:{" "}
            {number(1234.5678, { minimumFractionDigits: 4 })}
          </p>
        </div>
      </section>

      {/* Monedas */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Formatos de Moneda</h3>
        <div className="space-y-1 text-sm">
          <p>USD: {currency(1234.56, "USD")}</p>
          <p>EUR: {currency(1234.56, "EUR")}</p>
          <p>MXN: {currency(1234.56, "MXN")}</p>
          <p>COP: {currency(1234.56, "COP")}</p>
        </div>
      </section>

      {/* Listas */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Formatos de Listas</h3>
        <div className="space-y-1 text-sm">
          <p>
            Conjunción: {list(["Facebook", "Instagram", "Twitter"], "conjunction")}
          </p>
          <p>
            Disyunción: {list(["Lunes", "Martes", "Miércoles"], "disjunction")}
          </p>
        </div>
      </section>

      {/* Pluralización */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Pluralización</h3>
        <div className="space-y-1 text-sm">
          <p>0 {plural(0, "publicación", "publicaciones")}</p>
          <p>1 {plural(1, "publicación", "publicaciones")}</p>
          <p>5 {plural(5, "publicación", "publicaciones")}</p>
        </div>
      </section>

      {/* Traducción con IA */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Traducción con IA</h3>
        <button
          onClick={handleTranslate}
          disabled={isTranslating}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {isTranslating ? "Traduciendo..." : "Traducir Texto de IA"}
        </button>
        {translatedText && (
          <p className="text-sm mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded">
            {translatedText}
          </p>
        )}
      </section>
    </div>
  );
};
