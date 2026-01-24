using System.Collections;
using UnityEngine;

public class AnimationController : MonoBehaviour
{
    public AudioSource audioSource;
    public Animator animator;

    public int animationCount = 3;
    public float changeInterval = 0.4f;

    Coroutine animationRoutine;


    public void PlayAnimation(AudioSource audioSource)
    {
        this.audioSource = audioSource;
        if (animator != null) { 
            if (animationRoutine != null)
                StopCoroutine(animationRoutine);

            animationRoutine = StartCoroutine(AnimateWhileAudioPlays());
        }
    }

    IEnumerator AnimateWhileAudioPlays()
    {
        animator.SetBool("Talking", true);

        while (audioSource.isPlaying)
        {
            float random = Random.Range(0, animationCount);
            animator.SetFloat("Blend", random);

            yield return new WaitForSeconds(changeInterval);
        }

        animator.SetBool("Talking", false);
    }
}
