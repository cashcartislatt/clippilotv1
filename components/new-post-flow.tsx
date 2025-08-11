"use client"

import type React from "react"
import { ArrowLeft, ArrowRight, Upload, Youtube, Instagram, Wand2, Calendar, Eye, Camera, Folder, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useApp } from "@/contexts/app-context"
import { useRef, useState, useEffect, useMemo } from "react"

export function NewPostFlow() {
  const { state, dispatch } = useApp()
  const { newPostForm, newPostStep } = state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadProgressStep, setUploadProgressStep] = useState<string | null>(null)
  const [uploadProgressPercent, setUploadProgressPercent] = useState<number>(0)
  const [uploadProgressError, setUploadProgressError] = useState<string | null>(null)
  const [isScheduling, setIsScheduling] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [showScheduleStatus, setShowScheduleStatus] = useState<null | { success: boolean; message: string }>(null);
  const [selectedChannel, setSelectedChannel] = useState<'channel1' | 'channel2'>('channel1');

  const steps = ["Upload Video", "Select Platforms", "Edit Video", "Caption & Hashtags", "Schedule", "Review"]

  const handleClose = () => {
    dispatch({ type: "SET_SHOW_NEW_POST", payload: false })
  }

  const handleNext = () => {
    if (newPostStep < steps.length) {
      dispatch({ type: "SET_NEW_POST_STEP", payload: newPostStep + 1 })
    }
  }

  const handleBack = () => {
    if (newPostStep > 1) {
      dispatch({ type: "SET_NEW_POST_STEP", payload: newPostStep - 1 })
    }
  }

  const updateForm = (updates: Partial<typeof newPostForm>) => {
    dispatch({ type: "UPDATE_NEW_POST_FORM", payload: updates })
  }

  const handlePlatformChange = (platform: string, checked: boolean) => {
    const platforms = checked
      ? [...newPostForm.platforms, platform]
      : newPostForm.platforms.filter((p) => p !== platform)

    updateForm({ platforms })
  }

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      updateForm({ videoFile: file, videoSource: file.name })
    }
  }

  const handleSubmit = async () => {
    setIsScheduling(true);
    setUploadProgressStep(null)
    setUploadProgressPercent(0)
    setUploadProgressError(null)
    // Validate title
    if (!newPostForm.title || newPostForm.title.trim().length === 0) {
      setUploadProgressError("Please enter a video title before uploading.");
      alert("Error: Please enter a video title before uploading.");
      return;
    }
    const jobId = Date.now().toString();
    dispatch({ type: "ADD_UPLOAD_JOB", payload: { id: jobId, title: newPostForm.title, progress: 10, step: "Fetching video link..." } });
    // Prepare data for API
    const videoLink = newPostForm.videoSource;
    const title = newPostForm.title && newPostForm.title.trim().length > 0 ? newPostForm.title : "Untitled Clip";
    const description = newPostForm.generatedCaption || newPostForm.customCaption || "";
    const hashtags = newPostForm.hashtags || [];
    const scheduleTime =
      newPostForm.scheduleType === "now"
        ? new Date().toISOString()
        : new Date(`${newPostForm.scheduleDate}T${newPostForm.scheduleTime}`).toISOString();
    try {
      dispatch({ type: "UPDATE_UPLOAD_JOB", payload: { id: jobId, updates: { progress: 30, step: "Downloading video..." } } });
      const res = await fetch("/api/schedule-youtube-short", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoLink, title, description, hashtags, scheduleTime, channel: selectedChannel }),
      });
      dispatch({ type: "UPDATE_UPLOAD_JOB", payload: { id: jobId, updates: { progress: 60, step: "Uploading to YouTube..." } } });
      const data = await res.json();
      if (res.ok) {
        dispatch({ type: "UPDATE_UPLOAD_JOB", payload: { id: jobId, updates: { progress: 90, step: "Scheduling on YouTube..." } } });
        dispatch({
          type: "ADD_SCHEDULED_POST",
          payload: {
            id: Date.now(),
            title,
            platforms: newPostForm.platforms,
            scheduledTime: scheduleTime,
            status: "scheduled",
            caption: description,
            hashtags,
            thumbnail: "",
          },
        });
        dispatch({ type: "UPDATE_UPLOAD_JOB", payload: { id: jobId, updates: { progress: 100, step: "Done!" } } });
        setShowScheduleStatus({ success: true, message: "Scheduled successfully!" });
        setTimeout(() => {
          setShowScheduleStatus(null);
          dispatch({ type: "REMOVE_UPLOAD_JOB", payload: jobId });
          setIsScheduling(false);
          dispatch({ type: "RESET_NEW_POST_FORM" });
          dispatch({ type: "SET_SHOW_NEW_POST", payload: false });
          dispatch({ type: "SET_ACTIVE_TAB", payload: "scheduled" });
        }, 2000);
      } else {
        let errorMsg = data.error || "Unknown error";
        if (errorMsg.includes("exceeded the number of videos")) {
          errorMsg = "You have exceeded the number of videos you may upload. Please try again later or contact support.";
        }
        dispatch({ type: "UPDATE_UPLOAD_JOB", payload: { id: jobId, updates: { error: errorMsg, step: "Error" } } });
        setUploadProgressError(errorMsg)
        setShowScheduleStatus({ success: false, message: errorMsg });
        setTimeout(() => {
          setShowScheduleStatus(null);
          setIsScheduling(false);
        }, 2000);
      }
    } catch (error) {
      dispatch({ type: "UPDATE_UPLOAD_JOB", payload: { id: jobId, updates: { error: "Network error: " + error, step: "Error" } } });
      setUploadProgressError("Network error: " + error)
      setShowScheduleStatus({ success: false, message: "Network error: " + error });
      setTimeout(() => {
        setShowScheduleStatus(null);
        setIsScheduling(false);
      }, 2000);
    }
  }

  // Stable video preview URL
  const [localVideoUrl, setLocalVideoUrl] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (newPostForm.videoFile) {
      const url = URL.createObjectURL(newPostForm.videoFile);
      setLocalVideoUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else if (newPostForm.videoSource && /^https?:\/\//.test(newPostForm.videoSource)) {
      setLocalVideoUrl(newPostForm.videoSource);
    } else {
      setLocalVideoUrl(undefined);
    }
  }, [newPostForm.videoFile, newPostForm.videoSource])

  // Fetch Instagram reel caption from the link in step 1 and show it in step 4 as 'Original caption'.
  useEffect(() => {
    async function fetchInstagramCaption(url: string) {
      try {
        const res = await fetch(`/api/instagram-caption?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (data.caption) {
          updateForm({ originalCaption: data.caption });
        }
      } catch (err) {
        updateForm({ originalCaption: "" });
      }
    }
    if (newPostForm.videoSource && newPostForm.videoSource.includes("instagram.com")) {
      fetchInstagramCaption(newPostForm.videoSource);
    } else {
      updateForm({ originalCaption: "" });
    }
  }, [newPostForm.videoSource])

  return (
    <div className="min-h-screen bg-white">
      {/* Show schedule status overlay */}
      {showScheduleStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className={`px-8 py-6 rounded-lg shadow-lg text-center ${showScheduleStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <h2 className="text-xl font-semibold mb-2">{showScheduleStatus.success ? 'Success!' : 'Failed'}</h2>
            <p className="text-base">{showScheduleStatus.message}</p>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <header className="mobile-sticky top-0 z-50 bg-white border-b border-gray-200 safe-top">
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 md:h-16">
            <div className="flex items-center space-x-3 md:space-x-4">
              <Button variant="ghost" onClick={handleClose} className="p-2 mobile-touch mobile-tap">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-lg md:text-xl font-semibold text-gray-900">Create New Post</h1>
            </div>
            <div className="text-xs md:text-sm text-gray-500">
              Step {newPostStep} of {steps.length}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Progress Bar */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="px-4 sm:px-6 py-3 md:py-4">
          {/* Mobile: Simplified progress */}
          <div className="md:hidden">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>{steps[newPostStep - 1]}</span>
              <span>
                {newPostStep}/{steps.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#1A73E8] h-2 rounded-full transition-all duration-300"
                style={{ width: `${(newPostStep / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Desktop: Full progress */}
          <div className="hidden md:flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                    index + 1 <= newPostStep ? "bg-[#1A73E8] text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {index + 1}
                </div>
                <span
                  className={`ml-2 text-sm font-medium transition-colors ${
                    index + 1 <= newPostStep ? "text-[#1A73E8]" : "text-gray-500"
                  }`}
                >
                  {step}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-0.5 mx-4 transition-colors ${
                      index + 1 < newPostStep ? "bg-[#1A73E8]" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-4 md:py-8 max-w-4xl mx-auto mobile-scroll">
        {/* Step 1: Upload Video */}
        {newPostStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Upload or Import Video</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Option A: Paste Video Link</Label>
                <div className="mt-2">
                  <Input
                    placeholder="Paste YouTube, Twitter, or TikTok link here..."
                    value={newPostForm.videoSource}
                    onChange={(e) => updateForm({ videoSource: e.target.value })}
                    className="w-full mobile-input"
                  />
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Option B: Upload from Device</Label>
                <div className="mt-2 space-y-3">
                  {/* Mobile: Two separate buttons */}
                  <div className="md:hidden space-y-3">
                    <Button
                      onClick={handleFileUpload}
                      variant="outline"
                      className="w-full h-12 border-2 border-dashed border-[#1A73E8] text-[#1A73E8] hover:bg-blue-50 mobile-touch mobile-tap bg-transparent"
                    >
                      <Folder className="w-5 h-5 mr-2" />
                      Choose from Gallery
                    </Button>

                    <Button
                      onClick={handleFileUpload}
                      variant="outline"
                      className="w-full h-12 border-2 border-dashed border-gray-300 hover:border-[#1A73E8] hover:text-[#1A73E8] hover:bg-blue-50 mobile-touch mobile-tap bg-transparent"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Record Video
                    </Button>
                  </div>

                  {/* Desktop: Drop zone */}
                  <div className="hidden md:block">
                    <div
                      onClick={handleFileUpload}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#1A73E8] transition-colors cursor-pointer mobile-tap"
                    >
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">Drop your video here</p>
                      <p className="text-gray-500 mb-4">or click to browse</p>
                      <Button
                        variant="outline"
                        className="border-[#1A73E8] text-[#1A73E8] hover:bg-blue-50 bg-transparent"
                      >
                        Choose File
                      </Button>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                    capture="environment"
                  />
                </div>
              </div>

              {newPostForm.videoFile && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">✓ Selected: {newPostForm.videoFile.name}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Platform Selection */}
        {newPostStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Select Platforms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors mobile-tap">
                  <Checkbox
                    id="youtube"
                    checked={newPostForm.platforms.includes("youtube")}
                    onCheckedChange={(checked) => handlePlatformChange("youtube", checked as boolean)}
                    className="mobile-touch"
                  />
                  <Youtube className="w-6 h-6 text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <Label htmlFor="youtube" className="font-medium text-base">
                      YouTube Shorts
                    </Label>
                    <p className="text-sm text-gray-500">Vertical videos up to 60 seconds</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors mobile-tap">
                  <Checkbox
                    id="instagram"
                    checked={newPostForm.platforms.includes("instagram")}
                    onCheckedChange={(checked) => handlePlatformChange("instagram", checked as boolean)}
                    className="mobile-touch"
                  />
                  <Instagram className="w-6 h-6 text-pink-600 flex-shrink-0" />
                  <div className="flex-1">
                    <Label htmlFor="instagram" className="font-medium text-base">
                      Instagram Reels
                    </Label>
                    <p className="text-sm text-gray-500">Vertical videos up to 90 seconds</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Video Editing */}
        {newPostStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Edit Video</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Trim Video</Label>
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-time" className="text-sm">
                        Start Time (seconds)
                      </Label>
                      <Input
                        id="start-time"
                        type="number"
                        min="0"
                        value={newPostForm.trimStart}
                        onChange={(e) => updateForm({ trimStart: Number.parseInt(e.target.value) || 0 })}
                        className="mt-1 mobile-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-time" className="text-sm">
                        End Time (seconds)
                      </Label>
                      <Input
                        id="end-time"
                        type="number"
                        min="1"
                        value={newPostForm.trimEnd}
                        onChange={(e) => updateForm({ trimEnd: Number.parseInt(e.target.value) || 30 })}
                        className="mt-1 mobile-input"
                      />
                    </div>
                  </div>

                  <div className="bg-gray-100 h-3 rounded-full relative">
                    <div className="bg-[#1A73E8] h-3 rounded-full transition-all" style={{ width: "60%" }} />
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 mobile-tap">
                <Checkbox
                  id="auto-crop"
                  checked={newPostForm.autoCrop}
                  onCheckedChange={(checked) => updateForm({ autoCrop: checked as boolean })}
                  className="mobile-touch mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="auto-crop" className="font-medium text-base">
                    Auto-crop to 9:16 vertical format
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">Automatically crop video for mobile viewing</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Caption & Hashtags */}
        {newPostStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Caption & Hashtags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Custom Title <span className="text-red-600">*</span></Label>
                <Input
                  placeholder="Enter video title..."
                  value={newPostForm.title || ""}
                  onChange={(e) => updateForm({ title: e.target.value })}
                  className={`mt-2 mobile-input ${!newPostForm.title ? 'border-red-500' : ''}`}
                />
                {!newPostForm.title && (
                  <p className="text-xs text-red-600 mt-1">A title is required to upload your video.</p>
                )}
              </div>

              <div>
                <Label className="text-base font-medium">Choose Caption Method</Label>
                <Select value={newPostForm.captionType} onValueChange={(value) => updateForm({ captionType: value })}>
                  <SelectTrigger className="mt-2 mobile-input">
                    <SelectValue placeholder="Select how to create your caption" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Write custom caption</SelectItem>
                    <SelectItem value="description">AI from description</SelectItem>
                    <SelectItem value="keywords">AI from keywords</SelectItem>
                    <SelectItem value="rephrase">AI rephrase existing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newPostForm.captionType === "custom" && (
                <div>
                  <Label htmlFor="custom-caption">Custom Caption</Label>
                  <Textarea
                    id="custom-caption"
                    placeholder="Write your caption here..."
                    value={newPostForm.customCaption}
                    onChange={(e) => updateForm({ customCaption: e.target.value })}
                    className="mt-2 mobile-input min-h-[100px]"
                    rows={4}
                  />
                </div>
              )}

              {newPostForm.captionType === "description" && (
                <div>
                  <Label htmlFor="description">Short Description</Label>
                  <Input
                    id="description"
                    placeholder="e.g., Meme about Kai Havertz missing a penalty"
                    value={newPostForm.description}
                    onChange={(e) => updateForm({ description: e.target.value })}
                    className="mt-2 mobile-input"
                  />
                </div>
              )}

              {newPostForm.captionType === "keywords" && (
                <div>
                  <Label htmlFor="keywords">Keywords</Label>
                  <Input
                    id="keywords"
                    placeholder="e.g., top 3 penalty misses"
                    value={newPostForm.keywords}
                    onChange={(e) => updateForm({ keywords: e.target.value })}
                    className="mt-2 mobile-input"
                  />
                </div>
              )}

              {newPostForm.captionType === "rephrase" && (
                <div>
                  <Label htmlFor="rephrase-caption">Caption to Rephrase</Label>
                  <Textarea
                    id="rephrase-caption"
                    placeholder="Paste your existing caption here..."
                    value={newPostForm.customCaption}
                    onChange={(e) => updateForm({ customCaption: e.target.value })}
                    className="mt-2 mobile-input min-h-[80px]"
                    rows={3}
                  />
                </div>
              )}

              {newPostForm.originalCaption && (
                <div>
                  <Label className="text-base font-medium">Original caption</Label>
                  <Textarea
                    value={newPostForm.originalCaption}
                    readOnly
                    className="mt-2 mobile-input min-h-[80px] bg-gray-100 text-gray-700"
                    rows={3}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 5: Scheduling */}
        {newPostStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Schedule Post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">When to Post</Label>
                <Select value={newPostForm.scheduleType} onValueChange={(value) => updateForm({ scheduleType: value })}>
                  <SelectTrigger className="mt-2 mobile-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="now">Post now</SelectItem>
                    <SelectItem value="later">Schedule for later</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newPostForm.scheduleType === "later" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="schedule-date">Date</Label>
                    <Input
                      id="schedule-date"
                      type="date"
                      value={newPostForm.scheduleDate}
                      onChange={(e) => updateForm({ scheduleDate: e.target.value })}
                      className="mt-2 mobile-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="schedule-time">Time</Label>
                    <Input
                      id="schedule-time"
                      type="time"
                      value={newPostForm.scheduleTime}
                      onChange={(e) => updateForm({ scheduleTime: e.target.value })}
                      className="mt-2 mobile-input"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 6: Review */}
        {newPostStep === 6 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Review & Confirm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Video Preview</h3>
                  <div className="aspect-[9/16] bg-gray-100 rounded-lg flex items-center justify-center max-w-xs mx-auto" style={{ height: '360px', width: '225px' }}>
                    {localVideoUrl ? (
                      <video
                        id="review-video"
                        src={localVideoUrl}
                        controls
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0.5rem', background: '#000' }}
                        onLoadedMetadata={e => {
                          const video = e.currentTarget;
                          updateForm({ videoDuration: video.duration });
                        }}
                        onLoadedData={() => setVideoReady(true)}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-full">
                        <Eye className="w-12 h-12 text-gray-400" />
                        <span className="text-xs text-gray-500 mt-2">No video selected or invalid video source</span>
                      </div>
                    )}
                  </div>
                  {/* Thumbnail selection/upload UI */}
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-2">Thumbnail</h4>
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) updateForm({ thumbnail: URL.createObjectURL(file), thumbnailFile: file });
                        }}
                        className="mb-2"
                      />
                      {/* Frame selection UI */}
                      {newPostForm.videoFile || newPostForm.videoSource ? (
                        <>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={0}
                              max={newPostForm.videoDuration || 60}
                              step={0.1}
                              value={newPostForm.thumbnailFrameTime || 0}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const time = Number(e.target.value);
                                updateForm({ thumbnailFrameTime: time });
                                const video = document.getElementById('review-video') as HTMLVideoElement;
                                if (video) video.currentTime = time;
                              }}
                              className="w-full"
                              disabled={!videoReady}
                            />
                            <span className="text-xs text-gray-500 min-w-[40px]">{(newPostForm.thumbnailFrameTime || 0).toFixed(1)}s</span>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => {
                              const video = document.getElementById('review-video') as HTMLVideoElement;
                              if (!video || !videoReady) return;
                              const canvas = document.createElement('canvas');
                              canvas.width = video.videoWidth;
                              canvas.height = video.videoHeight;
                              const ctx = canvas.getContext('2d');
                              if (ctx) {
                                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                                canvas.toBlob(blob => {
                                  if (blob) {
                                    const url = URL.createObjectURL(blob);
                                    updateForm({ thumbnail: url, thumbnailFile: blob });
                                  }
                                }, 'image/jpeg');
                              }
                            }}
                            className="w-full"
                            disabled={!videoReady}
                          >
                            Select Frame from Video
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => alert('Upload or import a video to select a frame.')}
                          className="w-full"
                          disabled
                        >
                          Select Frame from Video
                        </Button>
                      )}
                      {newPostForm.thumbnail && (
                        <img src={newPostForm.thumbnail} alt="Thumbnail preview" style={{ width: '100%', height: '360px', objectFit: 'cover', borderRadius: '0.5rem' }} className="mt-2 w-full max-w-xs mx-auto border" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Platforms</h3>
                    <div className="flex flex-wrap gap-2">
                      {newPostForm.platforms.map((platform) => (
                        <Badge key={platform} className="bg-[#1A73E8] text-white">
                          {platform === "youtube" ? "YouTube Shorts" : "Instagram Reels"}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Caption</h3>
                    <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                      {newPostForm.generatedCaption || newPostForm.customCaption || "No caption"}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Schedule</h3>
                    <p className="text-gray-700 text-sm">
                      {newPostForm.scheduleType === "now"
                        ? "Post immediately"
                        : `${newPostForm.scheduleDate} at ${newPostForm.scheduleTime}`}
                    </p>
                  </div>

                  {newPostForm.hashtags.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Hashtags</h3>
                      <div className="flex flex-wrap gap-1">
                        {newPostForm.hashtags.slice(0, 8).map((hashtag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {hashtag}
                          </Badge>
                        ))}
                        {newPostForm.hashtags.length > 8 && (
                          <Badge variant="secondary" className="text-xs">
                            +{newPostForm.hashtags.length - 8} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Select Channel</h3>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="channel"
                          value="channel1"
                          checked={selectedChannel === 'channel1'}
                          onChange={() => setSelectedChannel('channel1')}
                        />
                        <span>Channel 1</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="channel"
                          value="channel2"
                          checked={selectedChannel === 'channel2'}
                          onChange={() => setSelectedChannel('channel2')}
                        />
                        <span>Channel 2</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile Navigation */}
        <div className="flex justify-between mt-6 md:mt-8 pb-4">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={newPostStep === 1}
            className="flex items-center bg-transparent mobile-touch mobile-tap"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {newPostStep < steps.length ? (
            <Button
              onClick={handleNext}
              disabled={
                (newPostStep === 1 && !newPostForm.videoSource && !newPostForm.videoFile) ||
                (newPostStep === 2 && newPostForm.platforms.length === 0)
              }
              className="bg-[#1A73E8] hover:bg-blue-700 text-white flex items-center transition-colors mobile-touch mobile-tap"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isScheduling}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center transition-colors mobile-touch mobile-tap"
            >
              {isScheduling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Confirm & Schedule</span>
                  <span className="sm:hidden">Schedule</span>
                </>
              )}
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}
