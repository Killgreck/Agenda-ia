import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(options?.headers || {})
  };
  
  const config: RequestInit = {
    ...options,
    headers: defaultHeaders,
    credentials: 'include' // Important for session cookies
  };
  
  const res = await fetch(url, config);
  
  // Handle unauthorized redirects
  if (res.status === 401 && !url.includes('/api/auth')) {
    window.location.href = '/auth';
    return {} as T;
  }
  
  await throwIfResNotOk(res);
  
  // For empty responses (e.g. 204 No Content)
  if (res.status === 204) {
    return {} as T;
  }
  
  return await res.json() as T;
}

type UnauthorizedBehavior = "returnNull" | "throw" | "redirect";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (res.status === 401) {
      if (unauthorizedBehavior === "returnNull") {
        return null;
      } else if (unauthorizedBehavior === "redirect") {
        window.location.href = '/auth';
        return null;
      }
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "redirect" }),
      refetchInterval: false,
      refetchOnWindowFocus: false, 
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
