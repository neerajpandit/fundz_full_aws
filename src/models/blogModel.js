import pool from "../config/db.js";

export const createBlogService = async (
  title,
  slug,
  content,
  meta_description,
  author_id = 1,
  tagsArray,
  category,
  status,
  featured_image
) => {
  try {
    const result = await pool.query(
      "INSERT INTO blogs (title,slug,content,meta_description,author_id,tags,category,status,featured_image) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING * ",
      [title,slug, content,meta_description, author_id, tagsArray, category, status, featured_image]
    );
    console.log(result.rows[0]);

    return result.rows[0];
  } catch (error) {
    console.error(error);
    throw new Error("Error Creating blog ");
  }
};

export const getAllBlogService = async () => {
  try {
    const result = await pool.query("SELECT id, title,meta_description,category,tags,content,status,views,likes,featured_image FROM blogs");
    return result.rows;
  } catch (error) {
    next(error);
  }
};

export const getBlogByIdService = async (id) => {
  try {
    const result = await pool.query("SELECT title FROM blogs WHERE id=$1", [id]);
    await incrementBlogViews(id);
    return result.rows[0];
  } catch (error) {
    next(error);
  }
};

export const getBlogBySlugService = async (slug) => {
  try {
    const result = await pool.query("SELECT * FROM blogs WHERE slug=$1", [slug]);
    await incrementBlogViews(result.rows[0].id);
    return result.rows[0];
  } catch (error) {
    next(error);
  }
};

export const updateBlogService = async (blogId, updateFields) => {
  const { title, content, tags, category, status, featured_image } =
    updateFields;

  try {
    const result = await pool.query(
      `
        UPDATE blogs
        SET 
          title = COALESCE($1, title),
          content = COALESCE($2, content),
          tags = COALESCE($3, tags),
          category = COALESCE($4, category),
          status = COALESCE($5, status),
          featured_image = COALESCE($6, featured_image),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING *;
        `,
      [title, content, tags, category, status, featured_image, blogId]
    );

    if (result.rows.length === 0) {
      throw new Error("Blog not found");
    }

    return result.rows[0];
  } catch (error) {
    throw new Error(`Error updating blog: ${error.message}`);
  }
};

export const incrementBlogViews = async (blogId) => {
  try {
    const result = await pool.query(
      "UPDATE blogs SET views = views + 1 WHERE id = $1 RETURNING *;",
      [blogId]
    );

    if (result.rows.length > 0) {
      return result.rows[0]; // Return the updated blog details
    } else {
      throw new Error("Blog not found");
    }
  } catch (error) {
    console.error(error);
    throw new Error("Error updating blog views");
  }
};

export const likeBlogService = async (blogId) => {
  try {
    const result = await pool.query(
      `
        UPDATE blogs
        SET likes = likes + 1
        WHERE id = $1
        RETURNING *;
        `,
      [blogId]
    );

    if (result.rows.length === 0) {
      throw new Error("Blog not found");
    }

    return result.rows[0];
  } catch (error) {
    throw new Error(`Error liking blog: ${error.message}`);
  }
};

export const deleteBlogService = async (blogId) => {
  try {
    const result = await pool.query("DELETE FROM blogs WHERE id = $1", [blogId]);

    if (result.rowCount === 0) {
      throw new Error("Blog not found");
    }

    return "Blog deleted successfully";
  } catch (error) {
    throw new Error(`Error deleting blog: ${error.message}`);
  }
};