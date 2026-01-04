{/* Google Business Profile */}
          {currentView === 'google-business' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Google Business Profile</h2>
                <p className="text-gray-600 mt-1">Manage your Google Business presence with AI</p>
              </div>

              {!isGBPConnected ? (
                /* Not Connected State */
                <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
                  <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Google Business Profile</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Connect your Google Business Profile to auto-optimize images, reply to reviews with AI, and send automated review requests.
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        // Initiate Google OAuth flow
                        const response = await fetch(`${apiUrl}/api/google-business/auth-url?userId=${user.id}`);
                        const data = await response.json();
                        
                        if (data.authUrl) {
                          // Open OAuth popup
                          window.location.href = data.authUrl;
                        }
                      } catch (error) {
                        console.error('Error starting OAuth:', error);
                        alert('Failed to connect. Please try again.');
                      }
                    }}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
                  >
                    <MapPin className="w-5 h-5" />
                    Connect Google Business Profile
                  </button>
                </div>
              ) : (
                /* Connected State */
                <>
                  {/* Profile Overview */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{gbpProfile?.name || user.businessName}</h3>
                          <p className="text-sm text-gray-600">Connected to Google Business</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Disconnect from Google Business Profile?')) {
                            setIsGBPConnected(false);
                            setGBPProfile(null);
                          }
                        }}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Disconnect
                      </button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <ImageIcon className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">{gbpImages.length}</p>
                        <p className="text-sm text-gray-600">Photos</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <Star className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
                        <p className="text-sm text-gray-600">Reviews</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <Mail className="w-6 h-6 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">{reviewRequests.filter(r => r.reviewed).length}/{reviewRequests.length}</p>
                        <p className="text-sm text-gray-600">Review Requests</p>
                      </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="border-b border-gray-200">
                      <div className="flex gap-1 p-2">
                        <button
                          type="button"
                          onClick={() => setActiveGBPTab('images')}
                          className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                            activeGBPTab === 'images'
                              ? 'bg-purple-100 text-purple-700'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <ImageIcon className="w-4 h-4 inline mr-2" />
                          AI Photo Upload
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveGBPTab('reviews')}
                          className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                            activeGBPTab === 'reviews'
                              ? 'bg-purple-100 text-purple-700'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <MessageSquare className="w-4 h-4 inline mr-2" />
                          AI Review Replies
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveGBPTab('requests')}
                          className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                            activeGBPTab === 'requests'
                              ? 'bg-purple-100 text-purple-700'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <Mail className="w-4 h-4 inline mr-2" />
                          Review Requests
                        </button>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* AI Photo Upload Tab */}
                      {activeGBPTab === 'images' && (
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Upload & Auto-Optimize Photos</h3>
                            <p className="text-sm text-gray-600 mb-4">
                              Upload photos and our AI will automatically add geo-tags and optimize them for Google Business Profile
                            </p>
                          </div>

                          {/* Upload Area */}
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <label className="cursor-pointer">
                              <span className="text-purple-600 hover:text-purple-700 font-medium">Upload photos</span>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleGBPImageUpload}
                                className="hidden"
                              />
                            </label>
                            <p className="text-xs text-gray-500 mt-2">JPG, PNG up to 5MB each</p>
                          </div>

                          {/* Uploaded Images */}
                          {gbpImages.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">Your Photos ({gbpImages.length})</h4>
                              <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                                {gbpImages.map((image, i) => (
                                  <div key={i} className="relative group">
                                    <img
                                      src={image.url}
                                      alt={`GBP ${i + 1}`}
                                      className="w-full h-24 object-cover rounded-lg"
                                    />
                                    {image.geotagged && (
                                      <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
                                        ✓ Geo-tagged
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* AI Review Replies Tab */}
                      {activeGBPTab === 'reviews' && (
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Review Responses</h3>
                            <p className="text-sm text-gray-600 mb-4">
                              Our AI automatically generates professional, personalized responses to your reviews
                            </p>
                          </div>

                          {reviews.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                              <p>No reviews yet</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {reviews.map((review) => (
                                <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <p className="font-semibold text-gray-900">{review.customerName}</p>
                                      <div className="flex items-center gap-1 mt-1">
                                        {[...Array(5)].map((_, i) => (
                                          <Star
                                            key={i}
                                            className={`w-4 h-4 ${
                                              i < review.rating
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-gray-300'
                                            }`}
                                          />
                                        ))}
                                        <span className="text-sm text-gray-500 ml-2">
                                          {new Date(review.date).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                    {review.replied ? (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                        Replied
                                      </span>
                                    ) : (
                                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                                        Pending
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-gray-700 mb-3">{review.text}</p>

                                  {!review.replied && (
                                    <div>
                                      {replyingToReview === review.id ? (
                                        <div className="space-y-2">
                                          <textarea
                                            value={reviewReply}
                                            onChange={(e) => setReviewReply(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                                            rows={3}
                                            placeholder="Write your reply..."
                                          />
                                          <div className="flex gap-2">
                                            <button
                                              type="button"
                                              onClick={() => handleGenerateAIReply(review)}
                                              disabled={isGeneratingReply}
                                              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
                                            >
                                              {isGeneratingReply ? (
                                                <>
                                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                                  Generating...
                                                </>
                                              ) : (
                                                <>
                                                  <Sparkles className="w-4 h-4" />
                                                  Generate AI Reply
                                                </>
                                              )}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleSubmitReply(review.id)}
                                              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition"
                                            >
                                              Post Reply
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setReplyingToReview(null);
                                                setReviewReply('');
                                              }}
                                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => setReplyingToReview(review.id)}
                                          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                                        >
                                          Reply to review
                                        </button>
                                      )}
                                    </div>
                                  )}

                                  {review.reply && (
                                    <div className="mt-3 pl-4 border-l-2 border-gray-200">
                                      <p className="text-sm font-semibold text-gray-900">Your reply:</p>
                                      <p className="text-sm text-gray-700 mt-1">{review.reply}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Review Requests Tab */}
                      {activeGBPTab === 'requests' && (
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Automated Review Requests</h3>
                            <p className="text-sm text-gray-600 mb-4">
                              Track who has been sent review requests and who has left a review
                            </p>
                          </div>

                          {reviewRequests.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <Mail className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                              <p>No review requests sent yet</p>
                              <p className="text-sm mt-2">Review requests are sent automatically after bookings</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {reviewRequests.map((request) => (
                                <div
                                  key={request.id}
                                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                      request.reviewed ? 'bg-green-100' : 'bg-gray-100'
                                    }`}>
                                      {request.reviewed ? (
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                      ) : (
                                        <Mail className="w-5 h-5 text-gray-600" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">{request.customerName}</p>
                                      <p className="text-sm text-gray-600">{request.customerEmail}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm text-gray-600">
                                      Sent {new Date(request.sentDate).toLocaleDateString()}
                                    </p>
                                    {request.reviewed ? (
                                      <div className="flex items-center gap-1 text-green-600 text-sm mt-1">
                                        <Star className="w-4 h-4 fill-green-600" />
                                        <span>Reviewed ({request.rating} stars)</span>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-500">Pending</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
