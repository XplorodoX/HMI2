using UnityEngine;

public class CameraController : MonoBehaviour
{
    public Camera activeCamera;

    public void SetActiveCamera(Camera camera)
    {
        if (activeCamera != null)
        {
            activeCamera.gameObject.SetActive(false);
        }
        activeCamera = camera;
        activeCamera.gameObject.SetActive(true);
    }
}
