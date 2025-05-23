import base64 from "react-native-base64";
import { setSecureItem } from "@/application/services/SecureStorageService";
import { User } from "@/types/types";
import {
  setItem,
  storeUserData,
} from "@/application/services/AsyncStorageService";

const CLIENT_ID = process.env.EXPO_PUBLIC_OAUTH_ID!;
const CLIENT_SECRET = process.env.EXPO_PUBLIC_OAUTH_SECRET!;
const REDIRECT_URI = process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URL!;

const REQUEST_ENDPOINT = "https://api.notion.com/v1/oauth/token";

const encodedAuthorization = () => {
  const credentials = `${CLIENT_ID}:${CLIENT_SECRET}`;
  return base64.encode(credentials);
};

export const getTokenFromCode = async (code: string) => {
  if (!code) return null;

  const encodedCredentials = encodedAuthorization();

  const config = {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedCredentials}`,
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: REDIRECT_URI,
    }),
  };

  const response = await fetch(REQUEST_ENDPOINT, config);
  const dataJson = await response.json();

  if (!response.ok) {
    console.error("Error converting code to token (notion):", dataJson);
    return null;
  }

  const userData = dataJson.owner.user;

  const user: User = {
    id: userData.id,
    name: userData.name,
    email: userData.email,
    image: userData.avatar_url,
  };
  console.log(user);

  setItem("user", user.id);
  storeUserData(userData.id, user);

  return dataJson.access_token;
};

export const validateToken = async (token: string) => {
  const config = {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedAuthorization()}`,
    },
    body: JSON.stringify({
      token: token,
    }),
  };

  const response = await fetch(
    "https://api.notion.com/v1/oauth/introspect",
    config
  );
  const dataJson = await response.json();

  if (!response.ok) {
    console.error("Error validating token (notion):", dataJson);
    return;
  }

  return dataJson.active;
};

export const revokeToken = async (token: string) => {
  const config = {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedAuthorization()}`,
    },
    body: JSON.stringify({
      token: token,
    }),
  };

  const response = await fetch(
    "https://api.notion.com/v1/oauth/revoke",
    config
  );
  const dataJson = await response.json();
  console.log("revokeToken", dataJson);

  if (!response.ok) {
    console.error("Error revoking token (notion):", dataJson);
    return;
  }

  return dataJson;
};
