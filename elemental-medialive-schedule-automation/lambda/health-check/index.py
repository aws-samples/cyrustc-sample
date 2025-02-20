import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
from urllib.parse import urljoin
import json

def validate_streaming_endpoint(url):
    try:
        # Get the manifest
        request = urllib.request.Request(url, headers={'User-Agent': 'Python Health Check'})
        with urllib.request.urlopen(request, timeout=10) as response:
            manifest_content = response.read().decode('utf-8')
        
        # Determine manifest type based on file extension
        if url.endswith('.m3u8'):
            return validate_hls(manifest_content, url)
        elif url.endswith('.mpd'):
            return validate_dash(manifest_content)
        else:
            return False, "Unsupported manifest format"

    except urllib.error.URLError as e:
        return False, f"Failed to fetch manifest: {str(e)}"
    except Exception as e:
        return False, f"Error fetching manifest: {str(e)}"

def validate_hls(manifest_content, base_url):
    try:
        # Basic M3U8 validation
        lines = manifest_content.splitlines()
        if not lines or not lines[0].startswith('#EXTM3U'):
            return False, "Invalid HLS manifest: Missing #EXTM3U header"

        has_segments = False
        has_playlists = False
        segment_url = None

        for line in lines:
            # Check for variant playlists
            if line.startswith('#EXT-X-STREAM-INF:'):
                has_playlists = True
            # Check for segments
            elif line.startswith('#EXTINF:'):
                has_segments = True
            # Get first segment URL
            elif has_segments and not line.startswith('#') and line.strip():
                segment_url = urljoin(base_url, line.strip())
                break

        if not (has_segments or has_playlists):
            return False, "No segments or variant playlists found"

        # Validate first segment accessibility if present
        if segment_url:
            try:
                request = urllib.request.Request(segment_url, method='HEAD')
                with urllib.request.urlopen(request, timeout=5):
                    pass
            except urllib.error.URLError:
                return False, f"First segment not accessible: {segment_url}"

        return True, "HLS manifest is valid"

    except Exception as e:
        return False, f"Invalid HLS manifest: {str(e)}"

def validate_dash(manifest_content):
    try:
        # Parse the DASH manifest
        root = ET.fromstring(manifest_content)
        
        # Check for essential DASH elements
        if root.tag.endswith('MPD'):
            # Check for at least one Period
            periods = root.findall(".//{urn:mpeg:dash:schema:mpd:2011}Period")
            if not periods:
                return False, "No Period found in DASH manifest"

            # Check for at least one AdaptationSet
            adaptation_sets = root.findall(".//{urn:mpeg:dash:schema:mpd:2011}AdaptationSet")
            if not adaptation_sets:
                return False, "No AdaptationSet found in DASH manifest"

            # Check for at least one Representation
            representations = root.findall(".//{urn:mpeg:dash:schema:mpd:2011}Representation")
            if not representations:
                return False, "No Representation found in DASH manifest"

            return True, "DASH manifest is valid"
        else:
            return False, "Invalid DASH manifest: Root element is not MPD"

    except ET.ParseError as e:
        return False, f"Invalid DASH manifest XML: {str(e)}"
    except Exception as e:
        return False, f"Error validating DASH manifest: {str(e)}"

def handler(event, context):
    """
    Check MediaLive channel health by validating streaming endpoint
    """
    try:
        print(f"Processing event: {json.dumps(event)}")

        # Get manifest URL from DynamoDB record
        manifest_url = event.get('manifestUrl')
        if not manifest_url:
            return {
                "status": "Unhealthy",
                "details": "Missing manifestUrl in record",
                **event  # Include all original event data
            }

        # Validate streaming endpoint
        is_valid, message = validate_streaming_endpoint(manifest_url)

        return {
            "status": "Healthy" if is_valid else "Unhealthy",
            "details": message,
            **event  # Include all original event data
        }

    except Exception as e:
        print(f"Error processing event: {str(e)}")
        return {
            "status": "Unhealthy",
            "details": f"Error checking health: {str(e)}",
            **event  # Include all original event data
        } 