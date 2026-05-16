<?php

declare(strict_types=1);

/**
 * Low-level WebSocket framing (RFC 6455 subset we need for this game).
 */
final class WebSocket
{
    private const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

    public static function handshake($socket, string $request): bool
    {
        if (!preg_match('/Sec-WebSocket-Key:\s*(.+)\r/i', $request, $match)) {
            return false;
        }

        $accept = base64_encode(sha1(trim($match[1]) . self::GUID, true));
        $reply  = "HTTP/1.1 101 Switching Protocols\r\n"
            . "Upgrade: websocket\r\n"
            . "Connection: Upgrade\r\n"
            . "Sec-WebSocket-Accept: {$accept}\r\n\r\n";

        return fwrite($socket, $reply) !== false;
    }

    public static function encode(string $payload): string
    {
        $len = strlen($payload);
        $header = chr(0x81);

        if ($len < 126) {
            return $header . chr($len) . $payload;
        }

        if ($len < 65536) {
            return $header . chr(126) . pack('n', $len) . $payload;
        }

        return $header . chr(127) . pack('J', $len) . $payload;
    }

    public static function sendJson($socket, array $data): void
    {
        $frame = self::encode(json_encode($data, JSON_UNESCAPED_UNICODE));
        if ($frame !== '') {
            @fwrite($socket, $frame);
        }
    }

    /**
     * @return array{messages: string[], close: bool}
     */
    public static function decodeFrames(string &$buffer): array
    {
        $messages = [];
        $close    = false;
        $offset   = 0;
        $total    = strlen($buffer);

        while ($offset < $total) {
            $opcode = ord($buffer[$offset]) & 0x0f;

            if ($opcode === 0x8) {
                $close = true;
                $offset += 2;
                break;
            }

            $masked    = (ord($buffer[$offset + 1]) & 0x80) !== 0;
            $len       = ord($buffer[$offset + 1]) & 0x7f;
            $headerLen = 2;

            if ($len === 126) {
                if ($offset + 4 > $total) {
                    break;
                }
                $len       = (ord($buffer[$offset + 2]) << 8) | ord($buffer[$offset + 3]);
                $headerLen = 4;
            } elseif ($len === 127) {
                break;
            }

            $maskStart = $offset + $headerLen;
            $dataStart = $maskStart + ($masked ? 4 : 0);
            $dataEnd   = $dataStart + $len;

            if ($dataEnd > $total) {
                break;
            }

            if ($opcode === 0x1) {
                $payload = substr($buffer, $dataStart, $len);
                if ($masked) {
                    $mask    = substr($buffer, $maskStart, 4);
                    $decoded = '';
                    for ($i = 0; $i < $len; $i++) {
                        $decoded .= $payload[$i] ^ $mask[$i % 4];
                    }
                    $messages[] = $decoded;
                } else {
                    $messages[] = $payload;
                }
            }

            $offset = $dataEnd;
        }

        $buffer = substr($buffer, $offset);
        return ['messages' => $messages, 'close' => $close];
    }
}
