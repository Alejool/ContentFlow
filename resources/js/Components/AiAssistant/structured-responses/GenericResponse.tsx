interface GenericResponseProps {
  data: any;
  theme: "dark" | "light";
}

export default function GenericResponse({ data, theme }: GenericResponseProps) {
  return (
    <div className="space-y-4">
      {data.title && (
        <h3
          className={`font-semibold text-lg ${
            theme === "dark" ? "text-gray-200" : "text-gray-800"
          }`}
        >
          {data.title}
        </h3>
      )}

      {data.message && (
        <div
          className={`p-3 rounded-lg ${
            theme === "dark" ? "bg-blue-900/20" : "bg-blue-50"
          }`}
        >
          <p className="text-sm">{data.message}</p>
        </div>
      )}

      {/* Mostrar cualquier dato adicional */}
      {Object.keys(data).map((key) => {
        if (
          ![
            "title",
            "message",
            "_metadata",
            "type",
            "success",
            "timestamp",
          ].includes(key)
        ) {
          const value = data[key];
          if (Array.isArray(value) && value.length > 0) {
            return (
              <div key={key} className="space-y-2">
                <h4
                  className={`font-medium text-sm capitalize ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {key.replace(/_/g, " ")}:
                </h4>
                <div className="space-y-2">
                  {value.map((item: any, index: number) => (
                    <div
                      key={index}
                      className={`p-2 rounded text-sm ${
                        theme === "dark" ? "bg-neutral-800/50" : "bg-gray-50"
                      }`}
                    >
                      {typeof item === "object" ? JSON.stringify(item) : item}
                    </div>
                  ))}
                </div>
              </div>
            );
          }
        }
        return null;
      })}
    </div>
  );
}
