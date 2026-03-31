import 'react';
import 'react-dom';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: unknown;
    }
  }
}
