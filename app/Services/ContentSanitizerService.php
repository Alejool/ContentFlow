<?php

namespace App\Services;

use App\DTOs\SanitizationResult;
use HTMLPurifier;
use HTMLPurifier_Config;
use Illuminate\Support\Facades\Log;

class ContentSanitizerService
{
    private HTMLPurifier $purifier;
    
    public function __construct()
    {
        $config = HTMLPurifier_Config::createDefault();
        
        // Disable cache to ensure fresh configuration
        $config->set('Cache.DefinitionImpl', null);
        
        // Configuración estricta - permitir elementos específicos
        $config->set('HTML.DefinitionID', 'custom-html-def');
        $config->set('HTML.DefinitionRev', 1);
        $config->set('HTML.Allowed', 'p,br,strong,em,u,a[href],ul,ol,li,blockquote,h1,h2,h3,h4,img[src|alt|width|height]');
        $config->set('AutoFormat.RemoveEmpty', true);
        $config->set('AutoFormat.AutoParagraph', true);
        $config->set('URI.AllowedSchemes', ['http' => true, 'https' => true]);
        $config->set('URI.DisableExternalResources', false); // Allow images from external URLs
        
        $this->purifier = new HTMLPurifier($config);
    }
    
    public function sanitize(string $content): SanitizationResult
    {
        $original = $content;
        $sanitized = $this->purifier->purify($content);
        
        // Detectar si se removió contenido peligroso
        $wasModified = $original !== $sanitized;
        
        if ($wasModified) {
            Log::warning('Potentially dangerous content sanitized', [
                'original_length' => strlen($original),
                'sanitized_length' => strlen($sanitized),
                'user_id' => auth()->id(),
                'context' => 'ai_generated',
            ]);
        }
        
        // Validar URLs adicionales
        $sanitized = $this->validateUrls($sanitized);
        
        return new SanitizationResult($sanitized, $wasModified);
    }
    
    private function validateUrls(string $content): string
    {
        // Extraer y validar URLs
        $pattern = '/<a\s+href=["\']([^"\']+)["\']/i';
        
        return preg_replace_callback($pattern, function($matches) {
            $url = $matches[1];
            
            // Verificar que la URL sea válida y segura
            if (!filter_var($url, FILTER_VALIDATE_URL)) {
                return '<a href="#"';  // Reemplazar URL inválida
            }
            
            // Verificar esquema
            $scheme = parse_url($url, PHP_URL_SCHEME);
            if (!in_array($scheme, ['http', 'https'])) {
                return '<a href="#"';
            }
            
            return $matches[0];
        }, $content);
    }
}
