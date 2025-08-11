"use client"

import { Youtube, Instagram, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useApp } from "@/contexts/app-context"

export function SettingsPage() {
  const { state, dispatch } = useApp()
  const { settings } = state

  const handleConnectYoutube = () => {
    dispatch({ type: "UPDATE_SETTINGS", payload: { youtubeConnected: true } })
    alert("YouTube account connected successfully!")
  }

  const handleDisconnectInstagram = () => {
    if (confirm("Are you sure you want to disconnect your Instagram account?")) {
      dispatch({ type: "UPDATE_SETTINGS", payload: { instagramConnected: false } })
    }
  }

  const handleDisconnectYoutube = () => {
    if (confirm("Are you sure you want to disconnect your YouTube account?")) {
      dispatch({ type: "UPDATE_SETTINGS", payload: { youtubeConnected: false } })
    }
  }

  const handleConnectInstagram = () => {
    dispatch({ type: "UPDATE_SETTINGS", payload: { instagramConnected: true } })
    alert("Instagram account connected successfully!")
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-4">
      <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Settings</h2>

      {/* Account Connections */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Account Connections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg mobile-tap">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <Youtube className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-base">YouTube</h3>
                <p className="text-sm text-gray-500">Connect to post YouTube Shorts</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
              {settings.youtubeConnected ? (
                <>
                  <Badge className="bg-green-100 text-green-800 flex items-center space-x-1 text-xs">
                    <Check className="w-3 h-3" />
                    <span className="hidden sm:inline">Connected</span>
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnectYoutube}
                    className="mobile-touch mobile-tap text-xs px-2 py-1 md:px-3 md:py-2 md:text-sm bg-transparent"
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-600 flex items-center space-x-1 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span className="hidden sm:inline">Not Connected</span>
                  </Badge>
                  <Button
                    onClick={handleConnectYoutube}
                    className="bg-[#1A73E8] hover:bg-blue-700 text-white transition-colors mobile-touch mobile-tap text-xs px-2 py-1 md:px-3 md:py-2 md:text-sm"
                    size="sm"
                  >
                    Connect
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg mobile-tap">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <Instagram className="w-6 h-6 text-pink-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-base">Instagram</h3>
                <p className="text-sm text-gray-500">Connect to post Instagram Reels</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
              {settings.instagramConnected ? (
                <>
                  <Badge className="bg-green-100 text-green-800 flex items-center space-x-1 text-xs">
                    <Check className="w-3 h-3" />
                    <span className="hidden sm:inline">Connected</span>
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnectInstagram}
                    className="mobile-touch mobile-tap text-xs px-2 py-1 md:px-3 md:py-2 md:text-sm bg-transparent"
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-600 flex items-center space-x-1 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span className="hidden sm:inline">Not Connected</span>
                  </Badge>
                  <Button
                    className="bg-[#1A73E8] hover:bg-blue-700 text-white transition-colors mobile-touch mobile-tap text-xs px-2 py-1 md:px-3 md:py-2 md:text-sm"
                    size="sm"
                    onClick={handleConnectInstagram}
                  >
                    Connect
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">AI Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="ai-model" className="text-base font-medium">
              AI Model for Caption Generation
            </Label>
            <Select
              value={settings.aiModel}
              onValueChange={(value) => dispatch({ type: "UPDATE_SETTINGS", payload: { aiModel: value } })}
            >
              <SelectTrigger className="mt-2 mobile-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4">GPT-4 (Recommended)</SelectItem>
                <SelectItem value="gpt-3.5">GPT-3.5 Turbo</SelectItem>
                <SelectItem value="claude">Claude 3</SelectItem>
                <SelectItem value="gemini">Gemini Pro</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-1">Choose the AI model for generating captions and hashtags</p>
          </div>
        </CardContent>
      </Card>

      {/* Posting Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Posting Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between mobile-tap">
            <div className="flex-1 min-w-0 pr-4">
              <Label htmlFor="auto-post" className="text-base font-medium">
                Auto-post scheduled content
              </Label>
              <p className="text-sm text-gray-500 mt-1">Automatically post content at scheduled times</p>
            </div>
            <Switch
              id="auto-post"
              checked={settings.autoPost}
              onCheckedChange={(checked) => dispatch({ type: "UPDATE_SETTINGS", payload: { autoPost: checked } })}
              className="mobile-touch"
            />
          </div>

          <div className="flex items-center justify-between mobile-tap">
            <div className="flex-1 min-w-0 pr-4">
              <Label htmlFor="notifications" className="text-base font-medium">
                Email notifications
              </Label>
              <p className="text-sm text-gray-500 mt-1">Get notified when posts are published or fail</p>
            </div>
            <Switch
              id="notifications"
              checked={settings.notifications}
              onCheckedChange={(checked) => dispatch({ type: "UPDATE_SETTINGS", payload: { notifications: checked } })}
              className="mobile-touch"
            />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 text-lg md:text-xl">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 text-base">Delete Account</h3>
              <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" size="sm" className="mobile-touch mobile-tap w-full sm:w-auto">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
