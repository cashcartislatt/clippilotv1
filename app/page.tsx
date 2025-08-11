"use client"

import {
  Plus,
  TrendingUp,
  Eye,
  Heart,
  Share2,
  Calendar,
  Video,
  Upload,
  Home,
  FileText,
  SettingsIcon,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NewPostFlow } from "@/components/new-post-flow"
import { ScheduledPosts } from "@/components/scheduled-posts"
import { SettingsPage } from "@/components/settings-page"
import { useApp } from "@/contexts/app-context"
import { Youtube, Instagram } from "lucide-react"

export default function Dashboard() {
  const { state, dispatch } = useApp()

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
    if (num >= 1000) return (num / 1000).toFixed(1) + "K"
    return num.toString()
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "youtube":
        return "🎥"
      case "instagram":
        return "📸"
      default:
        return "📱"
    }
  }

  const handleNewPost = () => {
    dispatch({ type: "SET_SHOW_NEW_POST", payload: true })
  }

  const handleTabChange = (tab: string) => {
    dispatch({ type: "SET_ACTIVE_TAB", payload: tab })
  }

  if (state.showNewPost) {
    return <NewPostFlow />
  }

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      {/* Mobile Header */}
      <header className="mobile-sticky top-0 z-50 bg-white border-b border-gray-200 safe-top">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-14 md:h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#1A73E8] rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg md:text-xl font-semibold text-gray-900">ClipPilot</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <button
                onClick={() => handleTabChange("dashboard")}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors mobile-tap ${
                  state.activeTab === "dashboard" ? "text-[#1A73E8] bg-blue-50" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => handleTabChange("scheduled")}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors mobile-tap ${
                  state.activeTab === "scheduled" ? "text-[#1A73E8] bg-blue-50" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Scheduled Posts
              </button>
              <button
                onClick={() => handleTabChange("settings")}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors mobile-tap ${
                  state.activeTab === "settings" ? "text-[#1A73E8] bg-blue-50" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Settings
              </button>
            </nav>

            {/* Mobile New Post Button */}
            <Button
              onClick={handleNewPost}
              className="bg-[#1A73E8] hover:bg-blue-700 text-white transition-colors mobile-touch mobile-tap h-10 px-4 text-sm md:h-auto md:px-6 md:text-base"
            >
              <Plus className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">New Post</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-4 md:py-8 max-w-7xl mx-auto mobile-scroll">
        {state.activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Analytics Section */}
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">Analytics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm font-medium text-gray-600">Watch Hours</p>
                        <p className="text-lg md:text-xl font-bold text-gray-900">
                          {formatNumber(state.stats.watchHours)}h
                        </p>
                      </div>
                      <Clock className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                    </div>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +18.3%
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm font-medium text-gray-600">Views</p>
                        <p className="text-lg md:text-xl font-bold text-gray-900">{formatNumber(state.stats.views)}</p>
                      </div>
                      <Eye className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                    </div>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +12.5%
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm font-medium text-gray-600">Likes</p>
                        <p className="text-lg md:text-xl font-bold text-gray-900">{formatNumber(state.stats.likes)}</p>
                      </div>
                      <Heart className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                    </div>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +8.2%
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm font-medium text-gray-600">Shares</p>
                        <p className="text-lg md:text-xl font-bold text-gray-900">{formatNumber(state.stats.shares)}</p>
                      </div>
                      <Share2 className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                    </div>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +15.3%
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Recent Posts Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Recent Posts</h2>
                <Button
                  variant="outline"
                  onClick={() => handleTabChange("scheduled")}
                  className="text-[#1A73E8] border-[#1A73E8] hover:bg-blue-50 transition-colors mobile-touch mobile-tap text-sm h-8 px-3 md:h-9 md:px-4"
                >
                  View All
                </Button>
              </div>

              {state.scheduledPosts.length === 0 ? (
                <Card className="text-center py-8 md:py-10">
                  <CardContent>
                    <Upload className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                    <p className="text-gray-500 mb-4 text-sm">Create your first post to get started</p>
                    <Button
                      onClick={handleNewPost}
                      className="bg-[#1A73E8] hover:bg-blue-700 text-white mobile-touch mobile-tap"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Post
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {state.scheduledPosts.slice(0, 8).map((post) => (
                    <Card key={post.id} className="hover:shadow-sm transition-shadow mobile-tap group">
                      <CardContent className="p-3 md:p-4">
                        <div className="flex items-start space-x-3">
                          <div className="relative flex-shrink-0">
                            <img
                              src={post.thumbnail || "/placeholder.svg"}
                              alt={post.title}
                              className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200 flex items-center justify-center">
                              <div className="w-6 h-6 bg-white bg-opacity-0 group-hover:bg-opacity-90 rounded-full flex items-center justify-center transition-all duration-200">
                                <div className="w-0 h-0 group-hover:border-l-[6px] group-hover:border-l-gray-700 group-hover:border-t-[4px] group-hover:border-t-transparent group-hover:border-b-[4px] group-hover:border-b-transparent ml-0.5 transition-all duration-200"></div>
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 text-sm md:text-base line-clamp-2 mb-1">
                              {post.title}
                            </h3>

                            <div className="flex items-center space-x-2 mb-2">
                              {post.platforms.map((platform) => (
                                <div key={platform} className="flex items-center space-x-1">
                                  {platform === "youtube" ? (
                                    <Youtube className="w-3 h-3 md:w-4 md:h-4 text-red-600" />
                                  ) : (
                                    <Instagram className="w-3 h-3 md:w-4 md:h-4 text-pink-600" />
                                  )}
                                </div>
                              ))}
                              <Badge
                                variant="secondary"
                                className={`text-xs ${
                                  post.status === "scheduled"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : post.status === "posted"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                }`}
                              >
                                {post.status}
                              </Badge>
                            </div>

                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="w-3 h-3 mr-1" />
                              <span>
                                {new Date(post.scheduledTime).toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                })}{" "}
                                at{" "}
                                {new Date(post.scheduledTime).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>

                            {post.caption && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{post.caption}</p>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <Card className="hover:shadow-sm transition-shadow cursor-pointer mobile-tap" onClick={handleNewPost}>
                  <CardContent className="p-4 text-center">
                    <Plus className="w-6 h-6 md:w-8 md:h-8 text-[#1A73E8] mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">New Post</p>
                  </CardContent>
                </Card>

                <Card
                  className="hover:shadow-sm transition-shadow cursor-pointer mobile-tap"
                  onClick={() => handleTabChange("scheduled")}
                >
                  <CardContent className="p-4 text-center">
                    <Calendar className="w-6 h-6 md:w-8 md:h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">Schedule</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-sm transition-shadow cursor-pointer mobile-tap">
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">Analytics</p>
                  </CardContent>
                </Card>

                <Card
                  className="hover:shadow-sm transition-shadow cursor-pointer mobile-tap"
                  onClick={() => handleTabChange("settings")}
                >
                  <CardContent className="p-4 text-center">
                    <SettingsIcon className="w-6 h-6 md:w-8 md:h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">Settings</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {state.activeTab === "scheduled" && <ScheduledPosts />}
        {state.activeTab === "settings" && <SettingsPage />}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-50">
        <div className="grid grid-cols-3 h-16">
          <button
            onClick={() => handleTabChange("dashboard")}
            className={`flex flex-col items-center justify-center space-y-1 mobile-tap transition-colors ${
              state.activeTab === "dashboard" ? "text-[#1A73E8]" : "text-gray-600"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium">Dashboard</span>
          </button>

          <button
            onClick={() => handleTabChange("scheduled")}
            className={`flex flex-col items-center justify-center space-y-1 mobile-tap transition-colors ${
              state.activeTab === "scheduled" ? "text-[#1A73E8]" : "text-gray-600"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-xs font-medium">Scheduled</span>
          </button>

          <button
            onClick={() => handleTabChange("settings")}
            className={`flex flex-col items-center justify-center space-y-1 mobile-tap transition-colors ${
              state.activeTab === "settings" ? "text-[#1A73E8]" : "text-gray-600"
            }`}
          >
            <SettingsIcon className="w-5 h-5" />
            <span className="text-xs font-medium">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
