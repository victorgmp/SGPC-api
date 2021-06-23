import { ServiceBase, Configuration } from 'polymetis-node';
// import proxy from 'http-proxy-middleware';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import helmet from 'helmet';

// Initializing service
const configuration: Partial<Configuration> = {
  baseDir: __dirname,
};
const service = new ServiceBase({ configuration });

service.init()
  .then(async () => {
    service.logger.info('Setting proxy middleware options...');
    const routes = [
      {
        route: '/auth',
        target: 'http://localhost:8001/api',
      },
      {
        route: '/users',
        target: 'http://localhost:8002/api',
      },
    ];

    service.apiApp.use(cors());
    service.apiApp.use(helmet());

    // eslint-disable-next-line no-restricted-syntax
    for (const { route, target } of routes) {
      service.apiApp.use(
        route,
        createProxyMiddleware({
          target,
          changeOrigin: true,
          pathRewrite: (path: string) => {
            const afterPath = path.split('?').slice(1).join('?');
            const retPath = path.split('?')[0].split('/').slice(2).join('/');
            return `${retPath}${afterPath === '' ? '' : '?'}${afterPath}`;
          },
          logLevel: 'debug', //  ['debug', 'info', 'warn', 'error', 'silent']. Default: 'info'
        }),
      );
      service.logger.info('- ', route, '=>', target);
    }

    await service.initAPI();
  })
  .catch((error: any) => {
    service.logger.error('Exiting', error);
  });
