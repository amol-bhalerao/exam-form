<?php

namespace App\Support;

use DOMDocument;
use DOMElement;
use DOMNode;

/**
 * Allow-list HTML cleaner for rich text written in the CMS editor (pages, notices).
 * Keeps formatting, links, images and tables; drops scripts, event handlers and unsafe URLs.
 */
final class Html
{
    private const TAGS = [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'blockquote',
        'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div', 'hr', 'figure', 'figcaption', 'pre', 'code', 'iframe',
    ];
    private const ATTRS = ['href', 'src', 'alt', 'title', 'target', 'rel', 'colspan', 'rowspan', 'class', 'width', 'height', 'allowfullscreen', 'frameborder'];
    private const IFRAME_HOSTS = ['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'www.google.com', 'maps.google.com'];

    public static function clean(?string $html): ?string
    {
        if ($html === null || trim(strip_tags($html, '<img><iframe>')) === '') {
            return null;
        }
        $doc = new DOMDocument();
        libxml_use_internal_errors(true);
        $doc->loadHTML('<?xml encoding="utf-8"?><div id="__root">' . $html . '</div>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();
        $root = $doc->getElementById('__root');
        if (! $root) {
            return null;
        }
        self::walk($root);
        $out = '';
        foreach ($root->childNodes as $child) {
            $out .= $doc->saveHTML($child);
        }
        return trim($out) ?: null;
    }

    private static function walk(DOMNode $node): void
    {
        foreach (iterator_to_array($node->childNodes) as $child) {
            if ($child->nodeType === XML_COMMENT_NODE || $child->nodeType === XML_PI_NODE) {
                $node->removeChild($child);
                continue;
            }
            if (! $child instanceof DOMElement) {
                continue;
            }
            $tag = strtolower($child->tagName);
            if (in_array($tag, ['script', 'style', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'meta', 'link', 'base', 'svg', 'math'], true)) {
                $node->removeChild($child);
                continue;
            }
            if (! in_array($tag, self::TAGS, true)) {
                // Unwrap unknown tags but keep their text.
                self::walk($child);
                while ($child->firstChild) {
                    $node->insertBefore($child->firstChild, $child);
                }
                $node->removeChild($child);
                continue;
            }
            foreach (iterator_to_array($child->attributes) as $attr) {
                $name = strtolower($attr->name);
                if (! in_array($name, self::ATTRS, true)) {
                    $child->removeAttribute($attr->name);
                    continue;
                }
                if (in_array($name, ['href', 'src'], true) && ! self::safeUrl($attr->value, $tag === 'img')) {
                    $child->removeAttribute($attr->name);
                }
            }
            if ($tag === 'iframe') {
                $host = parse_url((string) $child->getAttribute('src'), PHP_URL_HOST);
                if (! in_array($host, self::IFRAME_HOSTS, true)) {
                    $node->removeChild($child);
                    continue;
                }
            }
            if ($tag === 'a' && $child->getAttribute('target') === '_blank') {
                $child->setAttribute('rel', 'noopener noreferrer');
            }
            self::walk($child);
        }
    }

    private static function safeUrl(string $url, bool $image): bool
    {
        $url = trim(html_entity_decode($url));
        if ($url === '' || str_starts_with($url, '/') || str_starts_with($url, '#')) {
            return true;
        }
        if ($image && preg_match('#^data:image/(png|jpe?g|gif|webp);base64,#i', $url)) {
            return true;
        }
        $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
        return in_array($scheme, ['http', 'https', 'mailto', 'tel'], true);
    }
}
