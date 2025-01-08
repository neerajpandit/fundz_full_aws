import pool from '../config/db.js';

export async function createTables() {


    const userDetailsQuery =`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'employee', 'user')),
            refresh_token text,
            refresh_token_expires_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    const blogQuery =`
        CREATE TABLE IF NOT EXISTS blogs (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            author_id INT NOT NULL REFERENCES users(id),
            tags TEXT[],
            category VARCHAR(100),
            status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            featured_image VARCHAR(255),
            views INT DEFAULT 0,
            likes INT DEFAULT 0
        );

    `;

    const backlinksQuery=`
        CREATE TABLE IF NOT EXISTS backlinks (
            id SERIAL PRIMARY KEY,
            blog_id INT NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
            url VARCHAR(255) NOT NULL,
            anchor_text VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `;

    const fundHouseQuery=`
        CREATE TABLE IF NOT EXISTS FundHouse (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        logo_url VARCHAR(255) NOT NULL,  -- Path or URL of the image
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    `;

    const schemeQuery=`
        CREATE TABLE IF NOT EXISTS Scheme (
            id SERIAL PRIMARY KEY,
            scheme_code VARCHAR(100) UNIQUE NOT NULL,
            scheme_name VARCHAR(255) NOT NULL,
            aum NUMERIC(15, 2) NOT NULL, 
            about TEXT, -- About the scheme
            status VARCHAR(50) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            fundhouse_id INT REFERENCES FundHouse(id) ON DELETE CASCADE 
        );

    `;

    try {
        await pool.query(userDetailsQuery); // Create userprofiles first
        await pool.query(blogQuery);
        await pool.query(backlinksQuery);
        await pool.query(fundHouseQuery);
        await pool.query(schemeQuery)

        console.log('Tables created successfully');
    } catch (error) {
        console.error('Error creating tables:', error.stack);
    }
}



