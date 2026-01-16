import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { EventEmitter } from 'events';

export interface JsonRpcRequest {
    jsonrpc: '2.0';
    method: string;
    params?: any;
    id: number;
}

export interface JsonRpcResponse {
    jsonrpc: '2.0';
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
    id: number;
}

export class Bridge extends EventEmitter {
    private child: ChildProcess | null = null;
    private requestId = 0;
    private pendingRequests = new Map<number, { resolve: Function; reject: Function }>();
    private buffer = '';

    constructor(private binaryPath?: string) {
        super();
    }

    public start(): void {
        const binPath = this.getBinaryPath();

        console.log(`[OmniAgentPay] Spawning sidecar: ${binPath}`);

        this.child = spawn(binPath, [], {
            stdio: ['pipe', 'pipe', 'inherit'], // stdin, stdout, stderr (inherit for logging)
            env: process.env // Pass environment variables (API Key etc)
        });

        this.child.stdout?.on('data', (data: Buffer) => {
            this.handleData(data.toString());
        });

        this.child.on('error', (err) => {
            console.error('[OmniAgentPay] Sidecar error:', err);
            this.emit('error', err);
        });

        this.child.on('exit', (code) => {
            console.warn(`[OmniAgentPay] Sidecar exited with code ${code}`);
            this.child = null;
            this.emit('exit', code);
        });
    }

    private getBinaryPath(): string {
        if (this.binaryPath) return this.binaryPath;

        // 1. Check for local dev build (repo root)
        const devPath = path.resolve(__dirname, '../../dist/omniagentpay-server');
        if (fs.existsSync(devPath)) return devPath;

        // 2. Check for installed binary (npm package structure)
        const prodPath = path.resolve(__dirname, '../bin/omniagentpay-server');
        if (fs.existsSync(prodPath)) return prodPath;

        // 3. Check for OS specific extensions (Windows .exe)
        // For simplicity, assuming Linux environment as per context, but good to have logic

        throw new Error(`Could not locate omniagentpay-server binary. Tries:\n${devPath}\n${prodPath}`);
    }

    private handleData(chunk: string): void {
        this.buffer += chunk;
        const lines = this.buffer.split('\n');

        // Process all complete lines
        this.buffer = lines.pop() || '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            // Heuristic: Only attempt to parse if it looks like JSON object
            if (!trimmed.startsWith('{')) {
                // Determine if this is a log line we should print to stderr
                // or just ignore. For now, let's treat it as a log.
                console.error(`[OmniAgentPay Sidecar Log] ${trimmed}`);
                continue;
            }

            try {
                const response = JSON.parse(trimmed) as JsonRpcResponse;
                this.resolveRequest(response);
            } catch (e) {
                console.error('[OmniAgentPay] Invalid JSON from sidecar:', trimmed);
            }
        }
    }

    private resolveRequest(response: JsonRpcResponse): void {
        const { id, result, error } = response;
        const request = this.pendingRequests.get(id);

        if (request) {
            if (error) {
                request.reject(new Error(error.message));
            } else {
                request.resolve(result);
            }
            this.pendingRequests.delete(id);
        }
    }

    public async send<T>(method: string, params: any = {}): Promise<T> {
        if (!this.child) {
            this.start();
        }

        return new Promise((resolve, reject) => {
            this.requestId++;
            const id = this.requestId;
            this.pendingRequests.set(id, { resolve, reject });

            const request: JsonRpcRequest = {
                jsonrpc: '2.0',
                method,
                params,
                id
            };

            this.child!.stdin?.write(JSON.stringify(request) + '\n');
        });
    }

    public stop(): void {
        this.child?.kill();
        this.child = null;
    }
}
