import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Hono } from 'hono';
import type { Handler } from 'hono/types';
import updatedFetch from '../src/__create/fetch';

const API_BASENAME = '/api';
const api = new Hono();

// Get current directory (only used in dev mode)
const __dirname = join(fileURLToPath(new URL('.', import.meta.url)), '../src/app/api');
if (globalThis.fetch) {
  globalThis.fetch = updatedFetch;
}

// Pre-import all routes using Vite glob (eager loading for production)
// This ensures routes are bundled into the server build
const routeModules = import.meta.glob('../src/app/api/**/route.js', {
  eager: true,
});

// Recursively find all route.js files
async function findRouteFiles(dir: string): Promise<string[]> {
  try {
    const files = await readdir(dir);
    let routes: string[] = [];

    for (const file of files) {
      try {
        const filePath = join(dir, file);
        const statResult = await stat(filePath);

        if (statResult.isDirectory()) {
          routes = routes.concat(await findRouteFiles(filePath));
        } else if (file === 'route.js') {
          // Handle root route.js specially
          if (filePath === join(__dirname, 'route.js')) {
            routes.unshift(filePath); // Add to beginning of array
          } else {
            routes.push(filePath);
          }
        }
      } catch (error) {
        console.error(`Error reading file ${file}:`, error);
      }
    }

    return routes;
  } catch (error) {
    // Directory doesn't exist (production build) - return empty array
    console.warn('Route directory not found (production mode):', dir);
    return [];
  }
}

// Helper function to transform file path to Hono route path
function getHonoPath(routeFile: string): { name: string; pattern: string }[] {
  const relativePath = routeFile.replace(__dirname, '');
  const parts = relativePath.split('/').filter(Boolean);
  const routeParts = parts.slice(0, -1); // Remove 'route.js'
  if (routeParts.length === 0) {
    return [{ name: 'root', pattern: '' }];
  }
  const transformedParts = routeParts.map((segment) => {
    const match = segment.match(/^\[(\.{3})?([^\]]+)\]$/);
    if (match) {
      const [_, dots, param] = match;
      return dots === '...'
        ? { name: param, pattern: `:${param}{.+}` }
        : { name: param, pattern: `:${param}` };
    }
    return { name: segment, pattern: segment };
  });
  return transformedParts;
}

// Import and register all routes
function registerRoutes() {
  // Clear existing routes
  api.routes = [];

  // Use glob-imported modules (works in both dev and production)
  if (Object.keys(routeModules).length > 0) {
    console.log(`🔧 Registering ${Object.keys(routeModules).length} API routes from glob import`);
    
    // Sort by path length (longest first) to handle nested routes correctly
    const sortedPaths = Object.keys(routeModules).sort((a, b) => b.length - a.length);
    
    for (const modulePath of sortedPaths) {
      try {
        const route = routeModules[modulePath] as any;
        const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
        
        // Convert Vite glob path to Hono route path
        // ../src/app/api/cities/route.js → /cities
        // ../src/app/api/admin/restaurants/[id]/images/route.js → /admin/restaurants/:id/images
        let apiPath = modulePath
          .replace('../src/app/api', '')
          .replace('/route.js', '')
          .replace(/\[\.\.\.([^\]]+)\]/g, ':$1{.+}') // [...slug] → :slug{.+} (catch-all)
          .replace(/\[([^\]]+)\]/g, ':$1'); // [id] → :id (dynamic param)
        
        // Root route
        if (!apiPath || apiPath === '') apiPath = '/';
        
        for (const method of methods) {
          if (typeof route[method] === 'function') {
            const handler: Handler = async (c) => {
              const params = c.req.param();
              // In dev, support HMR by re-importing
              if (import.meta.env.DEV) {
                try {
                  const freshRoute = await import(
                    /* @vite-ignore */ modulePath.replace('../src', '/src') + `?t=${Date.now()}`
                  );
                  return await freshRoute[method](c.req.raw, { params });
                } catch (e) {
                  // Fallback to original if HMR fails
                  return await route[method](c.req.raw, { params });
                }
              }
              // Production: use bundled route
              return await route[method](c.req.raw, { params });
            };
            
            const methodLower = method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch';
            api[methodLower](apiPath, handler);
            
            if (import.meta.env.DEV) {
              console.log(`  ✓ ${method.padEnd(6)} ${apiPath}`);
            }
          }
        }
      } catch (error) {
        console.error(`Error registering route ${modulePath}:`, error);
      }
    }
    
    console.log(`✅ Successfully registered ${sortedPaths.length} API route files`);
    return;
  }

  // This should never happen if glob import works
  console.error('❌ No routes found via glob import! This is a build configuration error.');
}

// Initial route registration (synchronous since routes are pre-imported)
registerRoutes();

// Hot reload routes in development
if (import.meta.env.DEV) {
  if (import.meta.hot) {
    import.meta.hot.accept((newSelf) => {
      console.log('🔄 Hot reloading API routes...');
      registerRoutes();
    });
  }
}

export { api, API_BASENAME };
