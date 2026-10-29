import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  return next(request).pipe(
    map((event) => {
      if (event instanceof HttpResponse && event.body) {
        const body = event.body as any;
        if (body && typeof body === 'object' && 'status' in body) {
          body.success = body.status === 'Success' || body.status === 0;
        }
      }
      return event;
    })
  );
};

