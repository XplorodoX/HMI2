using UnityEngine;

public class CameraController : MonoBehaviour
{
    public Camera activeCamera;

    public void SetActiveCamera(Vector3 pos,Vector3 rot)
    {
        activeCamera.transform.position = pos;
        activeCamera.transform.eulerAngles = rot;
    }
}
