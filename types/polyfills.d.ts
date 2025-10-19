declare module '@ungap/structured-clone' {
    export function structuredClone<T>(value: T): T;
    export default structuredClone;
}

declare module '@stardazed/streams-text-encoding' {
    export class TextEncoderStream {
        constructor();
        readonly readable: ReadableStream<Uint8Array>;
        readonly writable: WritableStream<string>;
    }

    export class TextDecoderStream {
        constructor(label?: string, options?: TextDecoderOptions);
        readonly readable: ReadableStream<string>;
        readonly writable: WritableStream<Uint8Array>;
    }
}
