"use client"

import { useState, useEffect } from "react"
import { Calendar, Youtube, Instagram, Clock, CheckCircle, XCircle, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApp } from "@/contexts/app-context"

export function ScheduledPosts() {
  const { state } = useApp();
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const uploadJobs = state.uploadJobs

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/schedule-youtube-short?list=1")
        const data = await res.json()
        if (res.ok && data.videos) {
          setVideos(data.videos)
        } else {
          setError(data.error || "Failed to fetch videos")
        }
      } catch (err) {
        setError("Network error")
      } finally {
        setLoading(false)
      }
    }
    fetchVideos()
  }, [])

  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4 md:space-y-6 pb-4">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900">My YouTube Videos</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>{filteredVideos.length} videos</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search videos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 mobile-input"
            />
          </div>
        </div>
      </div>
      {loading ? (
        <div className="text-center py-8 md:py-12">Loading videos...</div>
      ) : error ? (
        <div className="text-center py-8 md:py-12 text-red-600">{error}</div>
      ) : filteredVideos.length === 0 ? (
        <Card className="text-center py-8 md:py-12">
          <CardContent>
            <Calendar className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">No videos found</h3>
            <p className="text-gray-500 text-sm md:text-base">Try adjusting your search.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Show upload jobs (progress cards) above the video list */}
          {uploadJobs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
              {uploadJobs.map((job) => (
                <Card key={job.id} className="border-2 border-blue-300">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Youtube className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm md:text-base">{job.title}</h3>
                        <div className="w-full bg-gray-200 rounded-full h-3 mt-2 mb-2">
                          <div
                            className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-700">{job.step}</p>
                        {job.error && <p className="text-xs text-red-600 mt-1">{job.error}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {filteredVideos.map((video) => (
              <Card key={video.id} className="hover:shadow-sm transition-shadow mobile-tap group">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="relative flex-shrink-0">
                      <img
                        src={video.thumbnail || "/placeholder.svg"}
                        alt={video.title}
                        className="w-20 h-20 md:w-24 md:h-24 rounded-lg object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 text-sm md:text-base line-clamp-2 flex-1 pr-2">
                          {video.title}
                        </h3>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mb-2">
                        <Youtube className="w-4 h-4 text-red-600 mr-1" />
                        <span>
                          {video.publishedAt ? new Date(video.publishedAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }) : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
