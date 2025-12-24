const express = require('express');
const db = require('../db');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUDNAME,
    api_key: process.env.CLOUDINARY_API,
    api_secret: process.env.CLOUDINARY_APISEC
});

// Configure multer for file upload
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/user/:id
// Fetches a user's profile information
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [users] = await db.query('SELECT id, username, email, first_name, middle_name, last_name, date_of_birth, gender, phone, emergency_contact, address, city, state, zip, country_timezone, languages, communication_preference, profile_visibility, allow_marketing, mood_updates, profile_img, created_at FROM users WHERE id = ?', [id]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json(users[0]);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error while fetching user profile.' });
    }
});

// PUT /api/user/:id
// Updates a user's profile information
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { 
        email, 
        first_name, 
        middle_name,
        last_name, 
        date_of_birth,
        gender,
        phone,
        emergency_contact,
        address,
        city,
        state,
        zip,
        country,
        languages,
        country_timezone,
        communication_preference,
        profile_visibility,
        allow_marketing,
        mood_updates
    } = req.body;

    // For partial updates, only require basic fields if they're being updated
    if (first_name && !first_name.trim()) {
        return res.status(400).json({ message: 'First name cannot be empty.' });
    }
    if (last_name && !last_name.trim()) {
        return res.status(400).json({ message: 'Last name cannot be empty.' });
    }
    if (email && !email.trim()) {
        return res.status(400).json({ message: 'Email cannot be empty.' });
    }

    try {
        // Build the query dynamically based on provided fields
        const updateFields = [];
        const updateValues = [];

        if (email !== undefined) {
            updateFields.push('email = ?');
            updateValues.push(email);
        }
        if (first_name !== undefined) {
            updateFields.push('first_name = ?');
            updateValues.push(first_name);
        }
        if (middle_name !== undefined) {
            updateFields.push('middle_name = ?');
            updateValues.push(middle_name);
        }
        if (last_name !== undefined) {
            updateFields.push('last_name = ?');
            updateValues.push(last_name);
        }
        if (date_of_birth !== undefined) {
            updateFields.push('date_of_birth = ?');
            updateValues.push(date_of_birth);
        }
        if (gender !== undefined) {
            updateFields.push('gender = ?');
            updateValues.push(gender);
        }
        if (phone !== undefined) {
            updateFields.push('phone = ?');
            updateValues.push(phone);
        }
        if (emergency_contact !== undefined) {
            updateFields.push('emergency_contact = ?');
            updateValues.push(emergency_contact);
        }
        if (address !== undefined) {
            updateFields.push('address = ?');
            updateValues.push(address);
        }
        if (city !== undefined) {
            updateFields.push('city = ?');
            updateValues.push(city);
        }
        if (state !== undefined) {
            updateFields.push('state = ?');
            updateValues.push(state);
        }
        if (zip !== undefined) {
            updateFields.push('zip = ?');
            updateValues.push(zip);
        }
        if (country !== undefined || country_timezone !== undefined) {
            // Handle both country and country_timezone fields
            const timezoneValue = country_timezone || country;
            updateFields.push('country_timezone = ?');
            updateValues.push(timezoneValue);
        }
        if (languages !== undefined) {
            updateFields.push('languages = ?');
            updateValues.push(languages);
        }
        if (communication_preference !== undefined) {
            updateFields.push('communication_preference = ?');
            updateValues.push(communication_preference);
        }
        if (profile_visibility !== undefined) {
            updateFields.push('profile_visibility = ?');
            updateValues.push(profile_visibility);
        }
        if (allow_marketing !== undefined) {
            updateFields.push('allow_marketing = ?');
            updateValues.push(allow_marketing);
        }
        if (mood_updates !== undefined) {
            updateFields.push('mood_updates = ?');
            updateValues.push(mood_updates);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No valid fields to update.' });
        }

        // Add id as the last parameter
        updateValues.push(id);

        const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
        
        await db.query(updateQuery, updateValues);

        res.status(200).json({ message: 'Profile updated successfully.' });
    } catch (error) {
        console.error('Error updating user profile:', error);
        // Check for duplicate email error
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'This email is already in use.' });
        }
        res.status(500).json({ message: 'Server error while updating profile.' });
    }
});

// PUT /api/user/:id/profile
// Updates user profile information (excluding email)
router.put('/:id/profile', async (req, res) => {
    const { id } = req.params;
    const { 
        first_name, 
        middle_name,
        last_name, 
        date_of_birth,
        gender,
        phone,
        emergency_contact,
        address,
        city,
        state,
        zip,
        country,
        languages,
        country_timezone,
        communication_preference,
        profile_visibility,
        allow_marketing,
        mood_updates
    } = req.body;

    // Validate required fields
    if (!first_name || !first_name.trim()) {
        return res.status(400).json({ message: 'First name is required.' });
    }
    if (!last_name || !last_name.trim()) {
        return res.status(400).json({ message: 'Last name is required.' });
    }

    try {
        // Build the query dynamically based on provided fields
        const updateFields = [];
        const updateValues = [];

        if (first_name !== undefined) {
            updateFields.push('first_name = ?');
            updateValues.push(first_name);
        }
        if (middle_name !== undefined) {
            updateFields.push('middle_name = ?');
            updateValues.push(middle_name);
        }
        if (last_name !== undefined) {
            updateFields.push('last_name = ?');
            updateValues.push(last_name);
        }
        if (date_of_birth !== undefined) {
            updateFields.push('date_of_birth = ?');
            updateValues.push(date_of_birth);
        }
        if (gender !== undefined) {
            updateFields.push('gender = ?');
            updateValues.push(gender);
        }
        if (phone !== undefined) {
            updateFields.push('phone = ?');
            updateValues.push(phone);
        }
        if (emergency_contact !== undefined) {
            updateFields.push('emergency_contact = ?');
            updateValues.push(emergency_contact);
        }
        if (address !== undefined) {
            updateFields.push('address = ?');
            updateValues.push(address);
        }
        if (city !== undefined) {
            updateFields.push('city = ?');
            updateValues.push(city);
        }
        if (state !== undefined) {
            updateFields.push('state = ?');
            updateValues.push(state);
        }
        if (zip !== undefined) {
            updateFields.push('zip = ?');
            updateValues.push(zip);
        }
        if (country !== undefined || country_timezone !== undefined) {
            const timezoneValue = country_timezone || country;
            updateFields.push('country_timezone = ?');
            updateValues.push(timezoneValue);
        }
        if (languages !== undefined) {
            updateFields.push('languages = ?');
            updateValues.push(languages);
        }
        if (communication_preference !== undefined) {
            updateFields.push('communication_preference = ?');
            updateValues.push(communication_preference);
        }
        if (profile_visibility !== undefined) {
            updateFields.push('profile_visibility = ?');
            updateValues.push(profile_visibility);
        }
        if (allow_marketing !== undefined) {
            updateFields.push('allow_marketing = ?');
            updateValues.push(allow_marketing);
        }
        if (mood_updates !== undefined) {
            updateFields.push('mood_updates = ?');
            updateValues.push(mood_updates);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No valid fields to update.' });
        }

        // Add id as the last parameter
        updateValues.push(id);

        const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
        
        console.log('Profile update query:', updateQuery);
        console.log('Profile update values:', updateValues);
        
        const [result] = await db.query(updateQuery, updateValues);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({ 
            message: 'Profile updated successfully.',
            updated_fields: updateFields.length
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Server error while updating profile.' });
    }
});

// PUT /api/user/:id/email
// Updates user email only
router.put('/:id/email', async (req, res) => {
    const { id } = req.params;
    const { email } = req.body;

    // Validate email
    if (!email || !email.trim()) {
        return res.status(400).json({ message: 'Email is required.' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format.' });
    }

    try {
        const [result] = await db.query(
            'UPDATE users SET email = ? WHERE id = ?',
            [email, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        console.log('Email updated successfully for user', id, 'to', email);

        res.status(200).json({ 
            message: 'Email updated successfully.',
            new_email: email
        });
    } catch (error) {
        console.error('Error updating email:', error);
        // Check for duplicate email error
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'This email is already in use.' });
        }
        res.status(500).json({ message: 'Server error while updating email.' });
    }
});

// PUT /api/user/:id/avatar
// Updates user avatar image
router.put('/:id/avatar', upload.single('avatar'), async (req, res) => {
    const { id } = req.params;

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    try {
        // Upload to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `User Dashboard/user_${id}`,
                    public_id: 'profile_pic',
                    resource_type: 'image',
                    overwrite: true
                },
                (error, result) => error ? reject(error) : resolve(result)
            );
            streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
        });

        const picUrl = uploadResult.secure_url;
        console.log('Uploaded Profile URL:', picUrl);

        // Update user profile_img in database
        const [result] = await db.query(
            'UPDATE users SET profile_img = ? WHERE id = ?',
            [picUrl, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        console.log('Avatar updated successfully for user', id);

        res.status(200).json({ 
            message: 'Avatar updated successfully.',
            profile_img: picUrl
        });
    } catch (error) {
        console.error('Error updating avatar:', error);
        res.status(500).json({ message: 'Server error while updating avatar.' });
    }
});

module.exports = router;
