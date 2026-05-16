<?php

declare(strict_types=1);

final class StaticFileServer
{
    private string $root;
    /** @var array<string, string> */
    private array $mimeTypes;

    public function __construct(string $root, array $mimeTypes)
    {
        $this->root      = $root;
        $this->mimeTypes = $mimeTypes;
    }

    public function serve($socket, string $path): void
    {
        if ($path === '' || $path === '/') {
            $path = '/index.html';
        }

        $path = str_replace(['..', "\0"], '', $path);
        $file = $this->root . $path;
        $real = realpath($file);

        if ($real === false || !str_starts_with($real, $this->root) || !is_file($real)) {
            $this->respond($socket, 404, 'text/plain', 'Not found');
            return;
        }

        $ext  = strtolower(strrchr($real, '.') ?: '');
        $type = $this->mimeTypes[$ext] ?? 'application/octet-stream';
        $body = file_get_contents($real);

        $this->respond($socket, 200, $type, $body);
    }

    private function respond($socket, int $code, string $type, string $body): void
    {
        $status = $code === 200 ? '200 OK' : '404 Not Found';
        $header = "HTTP/1.1 {$status}\r\n"
            . "Content-Type: {$type}\r\n"
            . 'Content-Length: ' . strlen($body) . "\r\n"
            . "Connection: close\r\n\r\n";

        fwrite($socket, $header . $body);
    }
}
