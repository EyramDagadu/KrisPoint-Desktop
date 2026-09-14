use rand::RngCore;
use sha2::{Digest, Sha256};

use crate::backend::{read_credential, set_credential};

const DEVICE_CREDENTIAL: &str = "license-device-identity-v2";
const DEVICE_NAMESPACE: &[u8] = b"KrisPoint Solo device identity v2";

fn random_hex() -> String {
    let mut bytes = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut bytes);
    bytes.iter().map(|byte| format!("{byte:02x}")).collect()
}

fn protected_device_secret() -> Result<String, String> {
    match read_credential(DEVICE_CREDENTIAL) {
        Ok(value) => Ok(value),
        Err(error) if error.contains("is missing") => {
            let value = random_hex();
            set_credential(DEVICE_CREDENTIAL, &value)?;
            Ok(value)
        }
        Err(error) => Err(error),
    }
}

#[tauri::command]
pub fn get_solo_machine_id() -> Result<String, String> {
    let secret = protected_device_secret()?;
    let mut digest = Sha256::new();
    digest.update(DEVICE_NAMESPACE);
    digest.update(secret.as_bytes());
    let encoded: String = digest
        .finalize()
        .iter()
        .map(|byte| format!("{byte:02X}"))
        .collect();
    Ok(format!("KP2-{}", &encoded[..32]))
}

#[cfg(test)]
mod tests {
    use super::DEVICE_NAMESPACE;

    #[test]
    fn device_namespace_is_product_scoped() {
        assert_eq!(DEVICE_NAMESPACE, b"KrisPoint Solo device identity v2");
    }
}