import { TokenStorage } from "./token";

export async function clientApiFetch(
    url: string,
    token: string, 
    options: RequestInit = {} 
  ): Promise<Response> {
    try {

      const response = await fetch(url, {
        method: "POST", 
        headers: {
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}`, 
          ...options.headers,
        },
        body: options.body, 
        ...options,
      });
  
      return response;
      
    } catch (error) {
      console.error("API fetch error:", error);
      throw error;  
    }
  }
  