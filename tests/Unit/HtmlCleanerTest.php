<?php

namespace Tests\Unit;

use App\Support\Html;
use PHPUnit\Framework\TestCase;

class HtmlCleanerTest extends TestCase
{
    public function test_keeps_formatting_and_safe_links(): void
    {
        $out = Html::clean('<h2>Title</h2><p><strong>Bold</strong> <a href="https://mahahsscboard.in" target="_blank">site</a></p><ul><li>One</li></ul>');
        $this->assertStringContainsString('<h2>Title</h2>', $out);
        $this->assertStringContainsString('<strong>Bold</strong>', $out);
        $this->assertStringContainsString('rel="noopener noreferrer"', $out);
        $this->assertStringContainsString('<li>One</li>', $out);
    }

    public function test_removes_scripts_handlers_and_unsafe_urls(): void
    {
        $out = Html::clean('<p onmouseover="x()">Hi</p><script>bad()</script><img src="javascript:alert(1)" onerror="x"><a href="data:text/html,evil">l</a><iframe src="https://evil.example"></iframe><style>body{}</style>');
        foreach (['<script', 'onmouseover', 'onerror', 'javascript:', 'data:text', 'evil.example', '<style'] as $bad) {
            $this->assertStringNotContainsString($bad, $out);
        }
        $this->assertStringContainsString('Hi', $out);
    }

    public function test_keeps_marathi_text_and_youtube_embeds(): void
    {
        $out = Html::clean('<p>परीक्षा वेळापत्रक</p><iframe src="https://www.youtube.com/embed/abc"></iframe>');
        $this->assertStringContainsString('परीक्षा वेळापत्रक', $out);
        $this->assertStringContainsString('youtube.com/embed/abc', $out);
    }

    public function test_empty_content_becomes_null(): void
    {
        $this->assertNull(Html::clean('<p><br></p>'));
        $this->assertNull(Html::clean(null));
    }
}
