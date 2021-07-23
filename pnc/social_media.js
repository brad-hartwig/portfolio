
  var v2ProfileData = {
    ID: '',
    firstName: '',
    lastName: '',
    profilePicture: '',
    emailAddress: '',
    uploadUrl: '',
    asset: ''
  }

  var loaderIsOn = false;

  var showError = function(){
    jQuery('.social-media-error span').html('LinkedIn');
    jQuery('.social-media-error').removeClass('hide');
  }

  var v2Share = function(){
    var commentary = '';
    if (jQuery('#employee_id').val()){
      commentary = jQuery('#social_media_title').val().toUpperCase() + ": " + jQuery('#social_media_copy').val() + " -- Visit " + jQuery('#social_media_url').val() + " for more information!";
    }
    else{
      commentary = jQuery('#social_media_title').val().toUpperCase() + ": " + jQuery('#social_media_copy').val() + " -- Visit https://www.pncmortgage.com for more information!";
    }
    var token = localStorage.getItem('linkedInAccessToken'),
        json = {
          "author": "urn:li:person:" + v2ProfileData.ID,
          "lifecycleState": "PUBLISHED",
          "specificContent": {
            "com.linkedin.ugc.ShareContent": {
              "shareCommentary": {
                "text": commentary
              },
              "shareMediaCategory": "IMAGE",
              "media": [{
                "status": "READY",
                "description": {
                  "text": jQuery('#social_media_title').val()
                },
                "media": v2ProfileData.asset,
                "title": {
                  "text": ""
                }
              }]
            }
          },
          "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
          }
        };
    jQuery.ajax({
      url: '/auth/handler?func=linkedin_share',
      method: 'POST',
      data: {
        method: 'POST',
        uri: 'https://api.linkedin.com/v2/ugcPosts',
        json: JSON.stringify(json),
        token: token
      },
      success: function(response) {
        var parsed = JSON.parse(response);
        if ("serviceErrorCode" in parsed){
          console.log(parsed.message);
          showError();
        }
        else{
          var split = parsed.id.split(':');
          jQuery('.social-media-success span').html('LinkedIn');
          jQuery('.view-post').attr('href', 'https://www.linkedin.com/feed/update/urn:li:share:' + split.pop());
          jQuery('.social-media-success').removeClass('hide');
        }
        toggleFullscreenLoader();
        loaderIsOn = false;
      },
      failure: function(response) {
        showError();
        toggleFullscreenLoader();
        loaderIsOn = false;
      }
    });
  }

  var v2UploadImageStatus = function(){
    var token      = localStorage.getItem('linkedInAccessToken'),
        splitAsset = v2ProfileData.asset.split(':');
    jQuery.ajax({
      url: '/auth/handler?func=linkedin_upload_image_status',
      method: 'POST',
      data: {
        method: 'GET',
        uri: 'https://api.linkedin.com/v2/assets/' + splitAsset[3],
        token: token
      },
      success: function(response) {
        var parsed = JSON.parse(response);
        if ("serviceErrorCode" in parsed){
          console.log(parsed.message);
          showError();
          toggleFullscreenLoader();
          loaderIsOn = false;
        }
        else{
          v2Share();
        }
      },
      failure: function(response) {
        showError();
        toggleFullscreenLoader();
        loaderIsOn = false;
      }
    });
  }

  var v2UploadImage = function(){
    var token         = localStorage.getItem('linkedInAccessToken'),
        imageValue    = jQuery('#social_media_image').val(),
        imageStripped = imageValue.replace('https://pnc2.qa.multiad.com/saved_previews/','');
    jQuery.ajax({
      url: '/auth/handler?func=linkedin_upload_image',
      method: 'POST',
      data: {
        method: 'POST',
        uri: v2ProfileData.uploadUrl,
        token: token,
        upload_file: imageStripped
      },
      success: function(response) {
        v2UploadImageStatus();
      },
      failure: function(response) {
        showError();
        toggleFullscreenLoader();
        loaderIsOn = false;
      }
    });
  }

  var v2RegisterImage = function(){
    var token = localStorage.getItem('linkedInAccessToken'),
        json = {
          registerUploadRequest: {
            recipes: [
              'urn:li:digitalmediaRecipe:feedshare-image'
            ],
            owner: 'urn:li:person:' + v2ProfileData.ID,
            serviceRelationships: [
              {
                relationshipType: 'OWNER',
                identifier: 'urn:li:userGeneratedContent'
              }
            ]
          }
        };
    jQuery.ajax({
      url: '/auth/handler?func=linkedin_register_image',
      method: 'POST',
      data: {
        method: 'POST',
        uri: 'https://api.linkedin.com/v2/assets?action=registerUpload',
        json: JSON.stringify(json),
        token: token
      },
      success: function(response) {
        var parsed = JSON.parse(response);
        if ("serviceErrorCode" in parsed){
          console.log(parsed.message);
          showError();
          toggleFullscreenLoader();
          loaderIsOn = false;
        }
        else{
          v2ProfileData.uploadUrl = parsed.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
          v2ProfileData.asset = parsed.value.asset;
          v2UploadImage();
        }
      },
      failure: function(response) {
        showError();
        toggleFullscreenLoader();
        loaderIsOn = false;
      }
    });
  }

  
  var v2Authorize = function(){
    window.open("https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=77stnr4okqcr20&redirect_uri=https://pnc2.qa.multiad.com/auth/handler/linkedin_callback&state=43QKi9EjcMh6G42wzA9L&scope=r_liteprofile%20w_member_social", "linkedinWin", "width=530,height=690");
}

  var v2GetProfileData = function(){
    var token = localStorage.getItem('linkedInAccessToken');
    if (token == null){
      toggleFullscreenLoader();
      loaderIsOn = true;
      setTimeout(function(){
        v2Authorize();
      }, 500);
    }
    else{
      if (loaderIsOn === false){
        toggleFullscreenLoader();
      }
      jQuery.ajax({
        url: '/auth/handler?func=linkedin_profile_data',
        method: 'POST',
        data: {
          method: 'GET',
          uri: 'https://api.linkedin.com/v2/me',
          token: token
        },
        success: function(response) {
          var parsed = JSON.parse(response);
          if (parsed.status == 401){
            console.log(parsed.message);
            v2Authorize();
          }
          v2ProfileData.ID = parsed.id;
          v2ProfileData.firstName = parsed.firstName.localized.en_US;
          v2ProfileData.lastName = parsed.lastName.localized.en_US;
          v2RegisterImage();
        },
        failure: function(response) {
          showError();
          toggleFullscreenLoader();
          loaderIsOn = false;
        }
      });
    }
  }

jQuery(document).ready(function($) {
  $('body').delegate('.linked-in-btn', 'click', v2GetProfileData);
});
