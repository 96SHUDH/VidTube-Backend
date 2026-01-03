import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    // Adding system info makes this much more useful for DevOps/Monitoring
    const healthStatus = {
        status: "OK",
        uptime: process.uptime(), // returns server uptime in seconds
        timestamp: Date.now(),
        message: "Systems are operational"
    }
    
    return res
        .status(200)
        .json(new ApiResponse(200, "OK", "Health check passed"))
    
}) 
    
export{healthcheck}