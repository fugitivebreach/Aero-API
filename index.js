require('dotenv').config();
const express = require('express');
const axios = require('axios');
const noblox = require('noblox.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const validApiKeys = new Map();
const rateLimitedKeys = new Set();
const moderatedKeys = new Set();

async function validateApiKey(apiKey) {
    if (!apiKey) {
        return { valid: false, message: 'The API Key you input no longer exists' };
    }
    
    if (rateLimitedKeys.has(apiKey)) {
        return { valid: false, message: 'The API Key you input is ratelimited' };
    }
    
    if (moderatedKeys.has(apiKey)) {
        return { valid: false, message: 'The API Key you input is associated with a moderated account on our database' };
    }
    
    if (!validApiKeys.has(apiKey)) {
        return { valid: false, message: 'The API Key you input is no longer valid' };
    }
    
    return { valid: true };
}

async function validateRobloxCookie(cookie) {
    try {
        await noblox.setCookie(cookie);
        const currentUser = await noblox.getCurrentUser();
        return { valid: true, userId: currentUser.UserID, username: currentUser.UserName };
    } catch (error) {
        return { valid: false };
    }
}

async function checkUserInGroup(userId, groupId) {
    try {
        const role = await noblox.getRankInGroup(groupId, userId);
        return role > 0;
    } catch (error) {
        return false;
    }
}

async function getRobloxUserByUsername(username) {
    try {
        const userId = await noblox.getIdFromUsername(username);
        if (!userId) {
            return { valid: false };
        }
        return { 
            valid: true, 
            userId: userId,
            username: username,
            profile: `https://www.roblox.com/users/${userId}/profile`
        };
    } catch (error) {
        return { valid: false };
    }
}

async function setRankInGroup(groupId, targetUserId, rankId) {
    try {
        await noblox.setRank(groupId, targetUserId, rankId);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

app.post('/api/setrank', async (req, res) => {
    try {
        const apiKey = req.headers['api-key'];
        const { 'roblox-cookie': robloxCookie, 'group-id': groupId, 'rank-id': rankId, 'roblox-username': robloxUsername } = req.body;

        const apiKeyValidation = await validateApiKey(apiKey);
        if (!apiKeyValidation.valid) {
            return res.status(401).json({
                system: 'AeroAPI - Systems',
                message: apiKeyValidation.message
            });
        }

        if (!robloxCookie) {
            return res.status(400).json({
                system: 'AeroAPI - Systems',
                message: 'The ROBLOX Cookie set does not exist'
            });
        }

        const cookieValidation = await validateRobloxCookie(robloxCookie);
        if (!cookieValidation.valid) {
            return res.status(400).json({
                system: 'AeroAPI - Systems',
                message: 'The ROBLOX Cookie set does not exist'
            });
        }

        const isInGroup = await checkUserInGroup(cookieValidation.userId, groupId);
        if (!isInGroup) {
            return res.status(403).json({
                system: 'AeroAPI - Systems',
                message: 'The ROBLOX cookie account given, is not in the ROBLOX group input, thus, we cannot perform actions in the group'
            });
        }

        const targetUser = await getRobloxUserByUsername(robloxUsername);
        if (!targetUser.valid) {
            return res.status(404).json({
                system: 'AeroAPI - Systems',
                message: `Our systems have searched far and wide for the username '${robloxUsername}' and we were unable to find any account associated with that username`
            });
        }

        const rankResult = await setRankInGroup(groupId, targetUser.userId, rankId);
        if (!rankResult.success) {
            return res.status(403).json({
                system: 'AeroAPI - Systems',
                message: 'We were unable to perform rank set actions in the group requested, please check if sufficient permissions were given to the ROBLOX account cookie'
            });
        }

        return res.status(200).json({
            'roblox-username': targetUser.username,
            'roblox-id': targetUser.userId,
            'roblox-profile': targetUser.profile,
            'group-id': groupId,
            'rank-id': rankId,
            'returnCode': 200
        });

    } catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).json({
            system: 'AeroAPI - Systems',
            message: 'An internal error occurred while processing your request'
        });
    }
});

app.get('/', (req, res) => {
    res.json({
        name: 'AeroAPI',
        version: '1.0.0',
        endpoints: [
            {
                method: 'POST',
                path: '/api/setrank',
                description: 'Set rank for a Roblox user in a group'
            }
        ]
    });
});

app.listen(PORT, () => {
    console.log(`AeroAPI server running on port ${PORT}`);
    
    if (process.env.VALID_API_KEYS) {
        const keys = process.env.VALID_API_KEYS.split(',');
        keys.forEach(key => validApiKeys.set(key.trim(), true));
        console.log(`Loaded ${keys.length} valid API key(s)`);
    } else {
        console.warn('Warning: No VALID_API_KEYS configured in environment variables');
    }
});

module.exports = app;
