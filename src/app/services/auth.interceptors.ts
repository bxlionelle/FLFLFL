import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  
  // Add logging for debugging
  if (req.url.includes('/api/')) {
    console.log('🔍 Interceptor:', {
      url: req.url,
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'NO TOKEN'
    });
  }
  
  if (token) {
    const clonedRequest = req.clone({
      setHeaders: { 
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
    return next(clonedRequest);
  }

  return next(req);
};