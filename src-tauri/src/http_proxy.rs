use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct HttpRequest {
    pub url: String,
    pub method: String,
    pub headers: Option<std::collections::HashMap<String, String>>,
    pub body: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HttpResponse {
    pub status: u16,
    pub headers: std::collections::HashMap<String, String>,
    pub body: String,
}

#[command]
pub async fn http_request(request: HttpRequest) -> Result<HttpResponse, String> {
    let client = reqwest::Client::new();
    
    // Build request
    let mut req = match request.method.to_uppercase().as_str() {
        "GET" => client.get(&request.url),
        "POST" => client.post(&request.url),
        "PUT" => client.put(&request.url),
        "DELETE" => client.delete(&request.url),
        "PATCH" => client.patch(&request.url),
        _ => return Err(format!("Unsupported HTTP method: {}", request.method)),
    };

    // Add headers
    if let Some(headers) = request.headers {
        for (key, value) in headers {
            req = req.header(&key, &value);
        }
    }

    // Add body
    if let Some(body) = request.body {
        req = req.body(body);
    }

    // Send request
    let response = req.send().await.map_err(|e| e.to_string())?;

    // Extract response data
    let status = response.status().as_u16();
    
    let mut headers_map = std::collections::HashMap::new();
    for (key, value) in response.headers() {
        if let Ok(value_str) = value.to_str() {
            headers_map.insert(key.to_string(), value_str.to_string());
        }
    }

    let body = response.text().await.map_err(|e| e.to_string())?;

    Ok(HttpResponse {
        status,
        headers: headers_map,
        body,
    })
}
