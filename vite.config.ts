import { defineConfig } from 'vite'

const productionOrigin = 'https://info-hit.ru'
const proxiedRoots = ['/bitrix', '/include', '/local', '/upload', '/away.php']

export default defineConfig({
  server: {
    proxy: Object.fromEntries(
      proxiedRoots.map(root => [
        root,
        {
          target: productionOrigin,
          changeOrigin: true,
          secure: true,
        },
      ]),
    ),
  },
})
