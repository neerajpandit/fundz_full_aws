import pool from "../config/db.js";

export const createMutualFundService = async (name, mfLogo) => {
  try {
    const result = await pool.query(
      "INSERT INTO fundhouse (name,logo_url) VALUES ($1,$2) RETURNING *",
      [name, mfLogo]
    );
    // console.log(result.rows[0]);
    return result.rows[0];
  } catch (error) {}
};

export const createMutualSchemeService = async (
  scheme_code,
  scheme_name,
  about,
  status,
  fundhouse_id
) => {
  const query = `
    INSERT INTO Scheme (scheme_code, scheme_name, about, status, fundhouse_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [scheme_code, scheme_name, about, status, fundhouse_id];

  try {
    const result = await pool.query(query, values);
    //   console.log(result.rows[0]);
    return result.rows[0];
  } catch (error) {}
};
