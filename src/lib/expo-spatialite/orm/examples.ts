// ORM Usage Examples
import { BaseModel, ModelField } from "./base-model";
import { QueryBuilder } from "./query-builder";

// ============================================================================
// 1. MODEL DEFINITIONS
// ============================================================================

interface User {
  id: number;
  name: string;
  email: string;
  location?: string; // Geometry column
  created_at: string;
  active: boolean;
}

interface Profile {
  id: number;
  user_id: number;
  bio: string;
  avatar?: string;
  created_at: string;
}

interface Order {
  id: number;
  user_id: number;
  total: number;
  status: string;
  created_at: string;
}

// User Model
class UserModel extends BaseModel {
  constructor() {
    const fields: Record<string, ModelField> = {
      id: { name: "id", type: "INTEGER", primaryKey: true },
      name: { name: "name", type: "TEXT", nullable: false },
      email: { name: "email", type: "TEXT", nullable: false },
      location: { name: "location", type: "GEOMETRY" },
      created_at: { name: "created_at", type: "TEXT", defaultValue: "CURRENT_TIMESTAMP" },
      active: { name: "active", type: "BOOLEAN", defaultValue: true }
    };
    super("users", fields);
  }
}

class ProfileModel extends BaseModel {
  constructor() {
    const fields: Record<string, ModelField> = {
      id: { name: "id", type: "INTEGER", primaryKey: true },
      user_id: { name: "user_id", type: "INTEGER", nullable: false },
      bio: { name: "bio", type: "TEXT" },
      avatar: { name: "avatar", type: "TEXT" },
      created_at: { name: "created_at", type: "TEXT", defaultValue: "CURRENT_TIMESTAMP" }
    };
    super("profiles", fields);
  }
}

class OrderModel extends BaseModel {
  constructor() {
    const fields: Record<string, ModelField> = {
      id: { name: "id", type: "INTEGER", primaryKey: true },
      user_id: { name: "user_id", type: "INTEGER", nullable: false },
      total: { name: "total", type: "REAL", nullable: false },
      status: { name: "status", type: "TEXT", defaultValue: "pending" },
      created_at: { name: "created_at", type: "TEXT", defaultValue: "CURRENT_TIMESTAMP" }
    };
    super("orders", fields);
  }
}

// Model instances
export const User = new UserModel();
export const Profile = new ProfileModel();
export const Order = new OrderModel();

// ============================================================================
// 2. BASIC CRUD OPERATIONS
// ============================================================================

export async function basicCrudExamples() {
  // Find all users (default limit 100)
  const users = await User.findAll<User>();
  console.log("All users:", users);

  // Find all users with custom limit
  const moreUsers = await User.findAll<User>(500);
  console.log("More users:", moreUsers);

  // Find user by ID
  const user = await User.findById<User>(1);
  if (user) {
    console.log("Found user:", user.name);
  }

  // Find users with conditions
  const activeUsers = await User.find<User>({ 
    active: true, 
    status: 'verified' 
  });
  console.log("Active users:", activeUsers.length);

  // Create new user
  const newUser = await User.create<User>({
    name: "Jane Doe",
    email: "jane@example.com",
    active: true
  });
  console.log("Created user ID:", newUser.id);

  // Update user
  const updatedUser = await User.update<User>(1, {
    name: "John Smith",
    active: false
  });
  if (updatedUser) {
    console.log("Updated user:", updatedUser.name);
  }

  // Delete user
  const deleted = await User.delete(1);
  if (deleted) {
    console.log("User deleted successfully");
  }
}

// ============================================================================
// 3. PAGINATION EXAMPLES
// ============================================================================

export async function paginationExamples() {
  // First page
  const firstBatch = await User.findPaginated<User>();
  console.log("First batch:", firstBatch.length);

  // Next page using cursor
  if (firstBatch.length > 0) {
    const lastRecord = firstBatch[firstBatch.length - 1];
    const nextBatch = await User.findPaginated<User>(
      lastRecord.created_at,
      10,
      'created_at'
    );
    console.log("Next batch:", nextBatch.length);
  }

  // Paginate by ID
  const usersByIdBatch = await User.findPaginated<User>(
    "100", // cursor value
    20,    // limit
    'id'   // cursor field
  );
  console.log("Users after ID 100:", usersByIdBatch.length);
}

// ============================================================================
// 4. JOIN EXAMPLES
// ============================================================================

export async function joinExamples() {
  // Inner join - users with profiles
  const usersWithProfiles = await User.findWithJoin<User & Profile>(
    'profiles',
    'users.id = profiles.user_id',
    { 'users.active': true }
  );
  console.log("Users with profiles:", usersWithProfiles.length);

  // Left join - all users, with optional profiles
  const usersWithOptionalProfiles = await User.findWithLeftJoin<User & Partial<Profile>>(
    'profiles',
    'users.id = profiles.user_id'
  );
  console.log("All users (some with profiles):", usersWithOptionalProfiles.length);

  // Multiple conditions in join
  const recentUsersWithProfiles = await User.findWithJoin<User & Profile>(
    'profiles',
    'users.id = profiles.user_id',
    { 
      'users.active': true,
      'profiles.bio': 'NOT NULL'
    }
  );
  console.log("Recent active users with bios:", recentUsersWithProfiles.length);
}

// ============================================================================
// 5. QUERY BUILDER EXAMPLES
// ============================================================================

export async function queryBuilderExamples() {
  // Simple query with conditions
  const activeUsers = await new QueryBuilder<User>("users")
    .select(["id", "name", "email"])
    .where("active", "=", true)
    .where("created_at", ">", "2023-01-01")
    .orderBy("name", "ASC")
    .limit(10)
    .execute();
  console.log("Active users:", activeUsers);

  // Complex join query
  const userOrderData = await new QueryBuilder<User & Order>("users")
    .select(["users.name", "users.email", "orders.total", "orders.status"])
    .join("orders", "users.id = orders.user_id")
    .where("orders.status", "=", "completed")
    .where("orders.total", ">", 100)
    .orderBy("orders.total", "DESC")
    .limit(20)
    .execute();
  console.log("High-value completed orders:", userOrderData);

  // Multiple joins
  const userProfileOrders = await new QueryBuilder<User & Profile & Order>("users")
    .select(["users.name", "profiles.bio", "orders.total"])
    .leftJoin("profiles", "users.id = profiles.user_id")
    .join("orders", "users.id = orders.user_id")
    .where("users.active", "=", true)
    .orderBy("orders.created_at", "DESC")
    .limit(50)
    .execute();
  console.log("User profiles with orders:", userProfileOrders);

  // Pagination with query builder
  const paginatedUsers = await new QueryBuilder<User>("users")
    .select(["id", "name", "created_at"])
    .where("active", "=", true)
    .orderBy("created_at", "ASC")
    .limit(20)
    .offset(40) // Skip first 40 records
    .execute();
  console.log("Paginated users (page 3):", paginatedUsers);
}

// ============================================================================
// 6. SPATIAL/RAW QUERY EXAMPLES
// ============================================================================

export async function spatialQueryExamples() {
  // Find nearby users (spatial query)
  const nearbyUsers = await User.rawQuery<User & { distance: number }>(`
    SELECT *, ST_Distance(location, GeomFromText('POINT(36.8219 -1.2921)', 4326)) as distance
    FROM users 
    WHERE ST_Distance(location, GeomFromText('POINT(36.8219 -1.2921)', 4326)) < 1000
    ORDER BY distance
    LIMIT 10
  `);
  console.log("Nearby users:", nearbyUsers);

  // Users within a polygon (e.g., city boundary)
  const usersInCity = await User.rawQuery<User>(`
    SELECT * FROM users 
    WHERE Within(location, GeomFromText('POLYGON((36.7 -1.3, 36.9 -1.3, 36.9 -1.2, 36.7 -1.2, 36.7 -1.3))', 4326))
  `);
  console.log("Users in city:", usersInCity.length);

  // Complex aggregation with spatial data
  const userStats = await User.rawQuery<{
    total_users: number;
    active_users: number;
    avg_distance_from_center: number;
  }>(`
    SELECT 
      COUNT(*) as total_users,
      SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active_users,
      AVG(ST_Distance(location, GeomFromText('POINT(36.8219 -1.2921)', 4326))) as avg_distance_from_center
    FROM users 
    WHERE location IS NOT NULL
  `);
  console.log("User statistics:", userStats[0]);

  // Find users and their order totals
  const userOrderTotals = await User.rawQuery<{
    user_id: number;
    name: string;
    total_orders: number;
    total_spent: number;
  }>(`
    SELECT 
      u.id as user_id,
      u.name,
      COUNT(o.id) as total_orders,
      COALESCE(SUM(o.total), 0) as total_spent
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    WHERE u.active = 1
    GROUP BY u.id, u.name
    HAVING total_spent > 500
    ORDER BY total_spent DESC
  `);
  console.log("High-spending users:", userOrderTotals);
}

// ============================================================================
// 7. ADVANCED PATTERNS
// ============================================================================

export async function advancedPatterns() {
  // Batch operations
  const userIds = [1, 2, 3, 4, 5];
  const users = await Promise.all(
    userIds.map(id => User.findById<User>(id))
  );
  const validUsers = users.filter(user => user !== null);
  console.log("Batch loaded users:", validUsers.length);

  // Transaction-like pattern (manual)
  try {
    const user = await User.create<User>({
      name: "Test User",
      email: "test@example.com"
    });

    const profile = await Profile.create<Profile>({
      user_id: user.id,
      bio: "Test bio"
    });

    console.log("Created user and profile:", { user: user.id, profile: profile.id });
  } catch (error) {
    console.error("Failed to create user and profile:", error);
    // In a real transaction, you'd rollback here
  }

  // Search pattern
  const searchTerm = "john";
  const searchResults = await User.rawQuery<User>(`
    SELECT * FROM users 
    WHERE name LIKE ? OR email LIKE ?
    ORDER BY 
      CASE 
        WHEN name LIKE ? THEN 1 
        WHEN email LIKE ? THEN 2 
        ELSE 3 
      END,
      name
    LIMIT 20
  `, [
    `%${searchTerm}%`, `%${searchTerm}%`,
    `${searchTerm}%`, `${searchTerm}%`
  ]);
  console.log("Search results:", searchResults.length);

  // Conditional queries
  const filters = {
    active: true,
    minOrders: 5,
    location: { lat: -1.2921, lng: 36.8219, radius: 5000 }
  };

  let query = `
    SELECT u.*, COUNT(o.id) as order_count
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters.active !== undefined) {
    query += ` AND u.active = ?`;
    params.push(filters.active);
  }

  if (filters.location) {
    query += ` AND ST_Distance(u.location, GeomFromText('POINT(? ?)', 4326)) < ?`;
    params.push(filters.location.lng, filters.location.lat, filters.location.radius);
  }

  query += ` GROUP BY u.id`;

  if (filters.minOrders) {
    query += ` HAVING order_count >= ?`;
    params.push(filters.minOrders);
  }

  query += ` ORDER BY order_count DESC LIMIT 50`;

  const filteredUsers = await User.rawQuery<User & { order_count: number }>(query, params);
  console.log("Filtered users:", filteredUsers.length);
}

// ============================================================================
// 8. USAGE RUNNER
// ============================================================================

export async function runAllExamples() {
  console.log("=== Basic CRUD Examples ===");
  await basicCrudExamples();

  console.log("\n=== Pagination Examples ===");
  await paginationExamples();

  console.log("\n=== Join Examples ===");
  await joinExamples();

  console.log("\n=== Query Builder Examples ===");
  await queryBuilderExamples();

  console.log("\n=== Spatial Query Examples ===");
  await spatialQueryExamples();

  console.log("\n=== Advanced Patterns ===");
  await advancedPatterns();
}