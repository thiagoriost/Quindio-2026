
por que llamar al archivo index.tsx?

Porque es una convención para que la carpeta sea tratada como un módulo.

Sin index.tsx: se tendría que importar así:
import { SearchActionBar } from './components/SearchActionBar/SearchActionBar';

Con index.tsx: se puede importar de forma más limpia:
import { SearchActionBar } from './components/SearchActionBar';

El sistema de resolución de módulos de Node.js y Webpack busca automáticamente el archivo index si solo apuntas a la carpeta.