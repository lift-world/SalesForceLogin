const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const crypto = require('crypto');
const cors = require('cors');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const generateCodeVerifier = () => crypto.randomBytes(32).toString('hex');
const generateCodeChallenge = (codeVerifier) =>
  crypto.createHash('sha256').update(codeVerifier).digest('base64url');

const generateState = () => crypto.randomBytes(16).toString('hex');

const stateStorage = new Map();
let codeVerifier = null;
let user = null;

app.get('/auth/salesforce', (req, res) => {
  const originUrl = req.get('referer');
  const state = generateState();
  codeVerifier = generateCodeVerifier(); 
  const codeChallenge = generateCodeChallenge(codeVerifier);

  stateStorage.set(state, originUrl);

  const authUrl = new URL('https://login.salesforce.com/services/oauth2/authorize');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', process.env.CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', process.env.REDIRECT_URI);
  authUrl.searchParams.append('code_challenge', codeChallenge);
  authUrl.searchParams.append('code_challenge_method', 'S256');
  authUrl.searchParams.append('prompt', 'login');
  authUrl.searchParams.append('state', state);

  res.redirect(authUrl.toString());
});

app.get('/auth/salesforce/callback', async (req, res) => {
  const { code, state } = req.query;
  const originUrl = stateStorage.get(state);
  stateStorage.delete(state);

  if (!code) {
    return res.status(400).json({ error: 'Authorization code not provided' });
  }

  try {
    const tokenResponse = await axios.post('https://login.salesforce.com/services/oauth2/token', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        redirect_uri: process.env.REDIRECT_URI,
        code_verifier: codeVerifier,
      }
    });

    const { access_token, instance_url } = tokenResponse.data;

    const userInfo = await getProfile(access_token, instance_url);
    user = userInfo;
		user = {
			...userInfo,
			access_token:access_token
		}
		
    const redirectUrl = new URL(`${originUrl}/home/`);
    redirectUrl.searchParams.append('access_token', access_token);
    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Token exchange failed:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Internal server error during token exchange' });
  }
});

app.get('/auth/getUser', (req, res) => {
  const { token } = req.query;
  if (token === user?.access_token) {
    return res.json(user);
  } else {
    return res.status(401).json({ error: 'Unauthorized access' });
  }
});

app.get('/auth/logout', async (req, res) => {
  try {
    if (!req?.query?.token) {
	    return res.status(400).json({ error: 'No active session found' });
    }
    user = null;
    codeVerifier = null;
    res.send({success: true});
  } catch (error) {
    console.error('Logout failed:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Internal server error during logout' });
  }
});

const getProfile = async (accessToken, instanceUrl) => {
  try {
    const response = await axios.get(`${instanceUrl}/services/oauth2/userinfo`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user info:', error.response ? error.response.data : error.message);
    throw new Error('Failed to fetch user profile');
  }
};

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
