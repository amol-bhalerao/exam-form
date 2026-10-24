<?php

namespace App\View\Components;

use Illuminate\View\Component;

/** <x-icon name="printer" class="size-5" /> — inline Lucide icon (ISC licence, see resources/svg). */
class Icon extends Component
{
    private static array $cache = [];

    public function __construct(public string $name) {}

    public function render(): string
    {
        $svg = self::$cache[$this->name] ??= $this->load();
        return str_replace('<svg', '<svg {{ $attributes->merge(["aria-hidden" => "true", "focusable" => "false"]) }}', $svg);
    }

    private function load(): string
    {
        $path = resource_path("svg/{$this->name}.svg");
        $svg = is_file($path) ? file_get_contents($path) : '<svg viewBox="0 0 24 24"></svg>';
        $svg = preg_replace('/<!--.*?-->/s', '', $svg);
        // Strip size/class only from the outer <svg> tag; inner shapes (rect, circle) need their width/height.
        $svg = preg_replace_callback('/<svg\b[^>]*>/', fn ($m) => preg_replace('/\s(class|width|height)="[^"]*"/', '', $m[0]), $svg, 1);
        return trim(preg_replace('/\s+/', ' ', $svg));
    }
}
